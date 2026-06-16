/**
 * LoRa packet integrity guard (Cyberattack #7 — packet injection / spoofing).
 *
 * Threat: any LoRa transmitter on the same SF/BW/freq can forge a frame
 * claiming `device_id=NODE-01` because LoRa physical layer has no
 * authentication. Without per-device cryptographic signing, attackers
 * inject fake rainfall=999 → trigger false flood alerts.
 *
 * Defense: HMAC-SHA256 over the EXACT raw JSON body (byte-for-byte) using
 * a per-device pre-shared key (PSK). The gateway / node computes the MAC
 * and sends it in the X-LoRa-MIC HTTP header. The backend recomputes the
 * same MAC and `timingSafeEqual`s. Mismatch -> reject 401 + audit log.
 *
 * PSK registry: hardcoded here for the demo. Production path: Firestore
 * `station_secrets/{device_id}` read with admin SDK, never exposed client-side.
 */
import crypto from "crypto";

// FLIP FOR BEFORE/AFTER HMAC injection screenshots.
export const HMAC_GUARD_ENABLED = false;

// Per-device PSK. The PSK is shared ONLY between the physical device
// (programmed at provisioning time) and the backend. Never sent over the
// air, never stored in the dashboard, never reachable client-side.
const DEVICE_PSK: Record<string, string> = {
    "DEMO-NODE-01": "lora-psk-DEMO-NODE-01-c4f8a210e5",
    "DEMO-NODE-02": "lora-psk-DEMO-NODE-02-7b3e91f2d0",
};

export type HmacDecision =
    | { accepted: true; reason: "ok" | "guard_disabled" }
    | { accepted: false; reason: "no_mic" | "unknown_device" | "bad_mic"; detail: string };

/**
 * Verify HMAC over the raw request body. The body MUST be passed in as
 * the original bytes the client sent (use req.text()), because even a
 * trivial reformatting (whitespace, key order) breaks the MAC.
 */
export function checkHmac(
    device_id: string,
    rawBody: string,
    providedMic: string | null,
): HmacDecision {
    if (!HMAC_GUARD_ENABLED) {
        return { accepted: true, reason: "guard_disabled" };
    }
    if (!providedMic) {
        return { accepted: false, reason: "no_mic", detail: "Missing X-LoRa-MIC header." };
    }
    const psk = DEVICE_PSK[device_id];
    if (!psk) {
        return {
            accepted: false,
            reason: "unknown_device",
            detail: `No PSK registered for device_id='${device_id}'.`,
        };
    }
    const expectedHex = crypto.createHmac("sha256", psk).update(rawBody, "utf8").digest("hex");
    let expBuf: Buffer;
    let provBuf: Buffer;
    try {
        expBuf = Buffer.from(expectedHex, "hex");
        provBuf = Buffer.from(providedMic, "hex");
    } catch {
        return { accepted: false, reason: "bad_mic", detail: "X-LoRa-MIC is not valid hex." };
    }
    if (expBuf.length !== provBuf.length || !crypto.timingSafeEqual(expBuf, provBuf)) {
        return {
            accepted: false,
            reason: "bad_mic",
            detail: "MIC mismatch — payload not signed by the registered device PSK.",
        };
    }
    return { accepted: true, reason: "ok" };
}
