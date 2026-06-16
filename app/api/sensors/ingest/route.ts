/**
 * LoRa sensor ingest endpoint — validation only.
 *
 * Pipeline:
 *   1. Parse JSON body (also keep the raw bytes for HMAC verification).
 *   2. HMAC guard (Attack #7) — verifies X-LoRa-MIC over the raw body.
 *      An injected/forged frame from someone without the device PSK
 *      cannot produce the right MAC and is rejected with 401.
 *   3. Replay guard (Attack #6) — timestamp window + nonce dedupe.
 *
 * Persistence is intentionally NOT performed here so the demo cannot
 * pollute Firestore or burn quota. Each blocked frame writes ONE small
 * audit document to its respective collection (`loraInjectionAttempts`
 * or `loraReplayAttempts`).
 */
import { NextResponse } from "next/server";
import { checkReplay, REPLAY_GUARD_ENABLED, replayCacheStats } from "@/lib/security/replayGuard";
import { checkHmac, HMAC_GUARD_ENABLED } from "@/lib/security/hmacGuard";
import { decryptOrPass, AES_ENCRYPTION_REQUIRED } from "@/lib/security/aesGuard";
import { checkDevice, DEVICE_REGISTRY_ENABLED } from "@/lib/security/deviceRegistry";
import { recordHeartbeat } from "@/lib/security/heartbeatTracker";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { logSecurityEvent } from "@/lib/security/logSecurityEvent";

interface TelemetryFrame {
    device_id: string;
    timestamp: number;
    nonce: number | string;
    encrypted?: boolean;
    iv?: string;
    ciphertext?: string;
    temperature?: number;
    humidity?: number;
    pressure?: number;
    rainfall?: number;
}

export async function POST(req: Request) {
    // Read raw body for HMAC verification BEFORE parsing.
    let rawBody: string;
    try {
        rawBody = await req.text();
    } catch {
        return NextResponse.json({ success: false, error: "Could not read request body" }, { status: 400 });
    }
    let body: TelemetryFrame;
    try {
        body = JSON.parse(rawBody) as TelemetryFrame;
    } catch {
        return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }
    if (!body.device_id || typeof body.timestamp !== "number" || body.nonce === undefined) {
        return NextResponse.json(
            { success: false, error: "device_id, timestamp, nonce required" },
            { status: 400 },
        );
    }

    // ── 0. Device registry guard (rogue node join) ────────────────
    const dev = checkDevice(body.device_id);
    if (!dev.accepted) {
        try {
            await adminFirestore.collection("loraRogueJoinAttempts").add({
                device_id: body.device_id,
                reason: dev.reason,
                detail: dev.detail,
                blockedAt: Timestamp.now(),
            });
        } catch { /* drop silently */ }
        // Also surface in the Live Security Alerts feed on Cyber Demos page.
        try {
            await logSecurityEvent({
                type: "rogue_node_blocked",
                severity: "high",
                source: "real_request",
                summary: `Rogue LoRa device blocked: ${body.device_id}`,
                target: { device_id: body.device_id, route: "/api/sensors/ingest" },
                extra: { reason: dev.reason, detail: dev.detail },
            });
        } catch { /* drop silently */ }
        return NextResponse.json(
            {
                success: false,
                accepted: false,
                guard: "device_registry",
                reason: dev.reason,
                detail: dev.detail,
                registry_enabled: DEVICE_REGISTRY_ENABLED,
                logged_to: "loraRogueJoinAttempts",
            },
            { status: 403 },
        );
    }

    // ── 1. HMAC guard (packet injection / spoofing) ───────────────
    const providedMic = req.headers.get("x-lora-mic");
    const hmac = checkHmac(body.device_id, rawBody, providedMic);
    if (!hmac.accepted) {
        try {
            await adminFirestore.collection("loraInjectionAttempts").add({
                device_id: body.device_id,
                reason: hmac.reason,
                detail: hmac.detail,
                provided_mic: providedMic ?? null,
                blockedAt: Timestamp.now(),
            });
        } catch { /* drop silently */ }
        return NextResponse.json(
            {
                success: false,
                accepted: false,
                guard: "hmac",
                reason: hmac.reason,
                detail: hmac.detail,
                guard_enabled: HMAC_GUARD_ENABLED,
                logged_to: "loraInjectionAttempts",
            },
            { status: 401 },
        );
    }

    // ── 2. Replay guard ───────────────────────────────────────────
    const decision = checkReplay(body.device_id, body.timestamp, body.nonce);
    if (!decision.accepted) {
        try {
            await adminFirestore.collection("loraReplayAttempts").add({
                device_id: body.device_id,
                nonce: body.nonce,
                packet_timestamp: body.timestamp,
                reason: decision.reason,
                detail: decision.detail,
                blockedAt: Timestamp.now(),
            });
        } catch { /* drop silently */ }
        return NextResponse.json(
            {
                success: false,
                accepted: false,
                guard: "replay",
                reason: decision.reason,
                detail: decision.detail,
                guard_enabled: REPLAY_GUARD_ENABLED,
                logged_to: "loraReplayAttempts",
            },
            { status: 409 },
        );
    }

    // ── 3. AES payload confidentiality guard (eavesdropping) ─────
    const aes = decryptOrPass({
        device_id: body.device_id,
        encrypted: body.encrypted,
        iv: body.iv,
        ciphertext: body.ciphertext,
    });
    if (!aes.accepted) {
        try {
            await adminFirestore.collection("loraPlaintextAttempts").add({
                device_id: body.device_id,
                reason: aes.reason,
                detail: aes.detail,
                blockedAt: Timestamp.now(),
            });
        } catch { /* drop silently */ }
        return NextResponse.json(
            {
                success: false,
                accepted: false,
                guard: "aes",
                reason: aes.reason,
                detail: aes.detail,
                aes_required: AES_ENCRYPTION_REQUIRED,
                logged_to: "loraPlaintextAttempts",
            },
            { status: 400 },
        );
    }

    // If we decrypted, log a tiny success marker so the operator sees what
    // the radio attacker WOULD have captured had encryption not been used.
    const decryptedPlaintext = aes.reason === "decrypted" ? aes.plaintext ?? null : null;

    // Heartbeat for the jamming watchdog — happy-path frames only.
    recordHeartbeat(body.device_id);

    return NextResponse.json({
        success: true,
        accepted: true,
        guards: {
            hmac_enabled: HMAC_GUARD_ENABLED,
            replay_enabled: REPLAY_GUARD_ENABLED,
            aes_required: AES_ENCRYPTION_REQUIRED,
        },
        message: aes.reason === "decrypted"
            ? "Frame accepted (HMAC verified, replay validated, AES decrypted)."
            : aes.reason === "plaintext_allowed"
                ? "Frame accepted (plaintext — AES encryption is not yet required)."
                : "Frame accepted.",
        decrypted_preview: decryptedPlaintext
            ? `${decryptedPlaintext.slice(0, 60)}${decryptedPlaintext.length > 60 ? "…" : ""}`
            : undefined,
        cache: replayCacheStats(),
    });
}

export async function GET() {
    return NextResponse.json({
        status: "ok",
        cache: replayCacheStats(),
        hmac_enabled: HMAC_GUARD_ENABLED,
    });
}
