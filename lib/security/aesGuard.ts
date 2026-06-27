/**
 * LoRa payload confidentiality guard (Cyberattack #8 — eavesdropping).
 *
 * Threat: LoRa transmits cleartext bytes over the air. Anyone with an
 * SDR in range demodulates the frame and reads the JSON — temperature,
 * humidity, GPS coordinates — passively, leaving no trace on the
 * backend. Competitor intel / operational profiling.
 *
 * Defense: AES-256-CBC encryption of the JSON payload at the device,
 * with a per-device AppSKey (LoRaWAN-style). The device emits an
 * envelope:
 *   { device_id, timestamp, nonce, encrypted: true, iv, ciphertext }
 * and the backend decrypts before parsing. A captured radio frame
 * shows only ciphertext.
 *
 * Why CBC: HMAC over the outer envelope already provides authentication
 * + integrity, so we don't need AEAD's authentication tag — plain CBC
 * is enough and simpler to demo from PowerShell with built-in cmdlets.
 */
import crypto from "crypto";

// FLIP FOR BEFORE/AFTER AES eavesdropping screenshots.
export const AES_ENCRYPTION_REQUIRED = true;

// Per-device AppSKey, 32 hex chars = 16 bytes (AES-128) or 64 hex = 32 bytes (AES-256).
// Stored ONLY on the device + backend — never exposed client-side.
// Production: read from Firestore station_secrets via Admin SDK.
const DEVICE_AES_KEY: Record<string, string> = {
    // 32 bytes hex = AES-256
    "DEMO-NODE-01": "20cf5fa6f33e9b1d0e8f97a4b5c2d318e7a4b5c2d318e7a4b5c2d318e7a4b5c2",
    "DEMO-NODE-02": "5fa6f33e9b1d0e8f97a4b5c2d318e7a4b5c2d318e7a4b5c2d318e7a420cf5fa6",
    "STATION-ATTACK-DEMO": "94e1c20fb71d0e8f97a4b5c2d318e7a4b5c2d318e7a4b5c2d318e7a420cf5fa6",
};

export type AesDecision =
    | { accepted: true; reason: "decrypted" | "guard_disabled" | "plaintext_allowed"; plaintext?: string }
    | { accepted: false; reason: "plaintext_rejected" | "unknown_device" | "decrypt_failed"; detail: string };

/**
 * Process a parsed envelope. If the envelope carries `encrypted: true`,
 * decrypt the ciphertext using the device AES key and return the
 * plaintext. If the envelope is plaintext sensor JSON and encryption is
 * required by policy, reject. If encryption is not required, pass.
 */
export function decryptOrPass(envelope: {
    device_id: string;
    encrypted?: boolean;
    iv?: string;
    ciphertext?: string;
}): AesDecision {
    if (envelope.encrypted) {
        const keyHex = DEVICE_AES_KEY[envelope.device_id];
        if (!keyHex) {
            return {
                accepted: false,
                reason: "unknown_device",
                detail: `No AES key registered for device_id='${envelope.device_id}'.`,
            };
        }
        if (!envelope.iv || !envelope.ciphertext) {
            return {
                accepted: false,
                reason: "decrypt_failed",
                detail: "Envelope marked encrypted but missing iv / ciphertext.",
            };
        }
        try {
            const key = Buffer.from(keyHex, "hex");
            const iv = Buffer.from(envelope.iv, "hex");
            const ct = Buffer.from(envelope.ciphertext, "hex");
            const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
            const pt = Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
            return { accepted: true, reason: "decrypted", plaintext: pt };
        } catch (e) {
            return {
                accepted: false,
                reason: "decrypt_failed",
                detail: e instanceof Error ? e.message : "AES decryption error.",
            };
        }
    }

    // Plaintext envelope
    if (AES_ENCRYPTION_REQUIRED) {
        return {
            accepted: false,
            reason: "plaintext_rejected",
            detail: "Plaintext sensor payload rejected — AES encryption is required by policy.",
        };
    }
    return { accepted: true, reason: "plaintext_allowed" };
}
