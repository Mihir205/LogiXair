/**
 * EMQX → LogiXair webhook ingest.
 *
 * This is the cloud edge of the MQTT-only telemetry plane. EMQX's rule-engine
 * forwards every `stations/+/telemetry` message here as a signed HTTP POST.
 *
 * Defenses stacked here (all toggleable for before/after demos):
 *   - WEBHOOK_GUARD_ENABLED        signature on raw body (Cyberattack M11)
 *   - INPUT_VALIDATION_ENABLED     strict schema + physical bounds (Trinetra
 *                                  finding "mass-assignment / no validation")
 *   - generic error response       no internal error echoed (Trinetra finding
 *                                  "verbose errors leak details")
 *   - silent liveness GET          no internal state in the GET handler
 */
import { NextResponse } from "next/server";
import {
    adminFirestore,
    adminDatabase,
} from "@/lib/firebaseAdmin";
import crypto from "crypto";
import { checkWebhookSignature, WEBHOOK_GUARD_ENABLED } from "@/lib/security/emqxWebhookGuard";
import { logSecurityEvent } from "@/lib/security/logSecurityEvent";
import {
    logWebhookSpoofAttempt,
    logRetainedPoisonAttempt,
    logOversizedPayloadAttempt,
    logMqttReplayAttempt,
    logMqttInjectionAttempt,
    logMqttPlaintextAttempt,
} from "@/lib/security/mqttAttemptLogger";
// FLIP FOR BEFORE/AFTER MQTT replay-attack (M16) screenshots.
export const MQTT_REPLAY_GUARD_ENABLED = true;
// FLIP FOR BEFORE/AFTER MQTT packet-injection (M17) screenshots.
export const MQTT_HMAC_GUARD_ENABLED = true;
// FLIP FOR BEFORE/AFTER MQTT eavesdropping (M18) screenshots.
export const MQTT_AES_REQUIRED = true;

const MQTT_HMAC_HEADER = "x-mqtt-mic";
const MQTT_REPLAY_WINDOW_SEC = 60;
// Per-device PSK for the MQTT crypto chain. Demo only — production:
// read from Firestore station_secrets.
const MQTT_DEVICE_PSK: Record<string, string> = {
    "STATION-ATTACK-DEMO": "mqtt-psk-STATION-ATTACK-DEMO-94e1c20fb7",
};
// In-memory nonce cache, scoped to MQTT path (independent of LoRa's).
const _mqttSeenNonces = new Map<string, number>();

type MqttCryptoDecision =
    | { ok: true }
    | { ok: false; reason: string; detail?: string };

function mqttReplayCheck(deviceId: string, ts: unknown, nonce: unknown): MqttCryptoDecision {
    if (typeof ts !== "number" || nonce === undefined || nonce === null) {
        return { ok: false, reason: "missing_timestamp_or_nonce" };
    }
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > MQTT_REPLAY_WINDOW_SEC) {
        return { ok: false, reason: "stale_timestamp", detail: `drift=${Math.abs(now - ts)}s, window=±${MQTT_REPLAY_WINDOW_SEC}s` };
    }
    const k = `${deviceId}__${nonce}`;
    const seen = _mqttSeenNonces.get(k);
    if (seen !== undefined && now - seen <= MQTT_REPLAY_WINDOW_SEC) {
        return { ok: false, reason: "duplicate_nonce", detail: `seen ${now - seen}s ago` };
    }
    _mqttSeenNonces.set(k, now);
    // Tiny eviction sweep.
    if (_mqttSeenNonces.size > 1024) {
        for (const [key, t] of _mqttSeenNonces) {
            if (now - t > MQTT_REPLAY_WINDOW_SEC) _mqttSeenNonces.delete(key);
        }
    }
    return { ok: true };
}

function mqttHmacCheck(deviceId: string, rawBody: string, providedMic: string | null): MqttCryptoDecision {
    if (!providedMic) return { ok: false, reason: "no_mic", detail: `Missing ${MQTT_HMAC_HEADER} header.` };
    const psk = MQTT_DEVICE_PSK[deviceId];
    if (!psk) return { ok: false, reason: "unknown_device", detail: `No PSK registered for ${deviceId}.` };
    const exp = crypto.createHmac("sha256", psk).update(rawBody, "utf8").digest("hex");
    let a: Buffer, b: Buffer;
    try { a = Buffer.from(exp, "hex"); b = Buffer.from(providedMic, "hex"); }
    catch { return { ok: false, reason: "bad_mic_format", detail: `${MQTT_HMAC_HEADER} is not valid hex.` }; }
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return { ok: false, reason: "bad_mic", detail: "MIC mismatch — payload not signed by registered PSK." };
    }
    return { ok: true };
}

function mqttAesCheck(payload: Record<string, unknown>): MqttCryptoDecision {
    if (payload.encrypted === true && typeof payload.iv === "string" && typeof payload.ciphertext === "string") {
        return { ok: true };
    }
    return { ok: false, reason: "plaintext_rejected", detail: "AES encryption required by policy; payload is plaintext." };
}

// Demo device — payloads with this device_id are routed to dedicated
// Firestore attempt collections (mqtt*Attempts) and NEVER written to
// the live RTDB weather_station node, so real Bresser readings on the
// dashboard are not disturbed during before/after capture.
const DEMO_DEVICE_ID = "STATION-ATTACK-DEMO";

// FLIP FOR BEFORE/AFTER input-validation screenshots.
export const INPUT_VALIDATION_ENABLED = true;

// FLIP FOR BEFORE/AFTER oversized-payload (M7) screenshots.
// EMQX Cloud Serverless caps at ~1 MB platform-wide, can't be tuned.
// We defend code-side: reject anything over 2 KB before persistence.
export const PAYLOAD_SIZE_CAP_BYTES = 2048;
export const PAYLOAD_SIZE_CAP_ENABLED = true;

// FLIP FOR BEFORE/AFTER retained-message-poison (M5) screenshots.
// EMQX rule engine forwards EMQX message metadata in `flags.retain`.
// When true, we know it was a retained replay — defend by dropping.
export const REJECT_RETAINED_ENABLED = true;

// Allow-listed station IDs. Production: read from Firestore stations/{id}.
const KNOWN_STATIONS = new Set([
    "STATION-DEMO01",
    "STATION-DEMO02",
    "DEMO-NODE-01",
    "DEMO-NODE-02",
    DEMO_DEVICE_ID,
]);

type TelemetryPayload = {
    device_id: string;
    temperature: number;
    humidity: number;
    pressure?: number;
    rainfall?: number;
    wind_speed?: number;
    light_intensity?: number;
    timestamp?: number;
    nonce?: number;
};

function validateTelemetry(raw: unknown):
    | { ok: true; data: TelemetryPayload }
    | { ok: false; reason: string } {
    if (!INPUT_VALIDATION_ENABLED) {
        return { ok: true, data: raw as TelemetryPayload };
    }
    if (typeof raw !== "object" || raw === null) {
        return { ok: false, reason: "Body is not a JSON object." };
    }
    const r = raw as Record<string, unknown>;

    if (typeof r.device_id !== "string" || !KNOWN_STATIONS.has(r.device_id)) {
        return { ok: false, reason: "Unknown or missing device_id." };
    }

    const num = (v: unknown, min: number, max: number, name: string):
        | { ok: true; v: number }
        | { ok: false; reason: string } => {
        if (typeof v !== "number" || !Number.isFinite(v)) {
            return { ok: false, reason: `${name} must be a finite number.` };
        }
        if (v < min || v > max) {
            return { ok: false, reason: `${name}=${v} out of physical range [${min}, ${max}].` };
        }
        return { ok: true, v };
    };

    const t = num(r.temperature, -50, 80, "temperature");
    if (!t.ok) return { ok: false, reason: t.reason };
    const h = num(r.humidity, 0, 100, "humidity");
    if (!h.ok) return { ok: false, reason: h.reason };

    const optional = (v: unknown, min: number, max: number, name: string): number | undefined => {
        if (v === undefined) return undefined;
        const out = num(v, min, max, name);
        if (!out.ok) throw new Error(out.reason);
        return out.v;
    };

    try {
        const data: TelemetryPayload = {
            device_id: r.device_id,
            temperature: t.v,
            humidity: h.v,
            pressure: optional(r.pressure, 800, 1200, "pressure"),
            rainfall: optional(r.rainfall, 0, 500, "rainfall"),
            wind_speed: optional(r.wind_speed, 0, 100, "wind_speed"),
            light_intensity: optional(r.light_intensity, 0, 200000, "light_intensity"),
            timestamp: typeof r.timestamp === "number" ? r.timestamp : undefined,
            nonce: typeof r.nonce === "number" ? r.nonce : undefined,
        };
        return { ok: true, data };
    } catch (e) {
        return { ok: false, reason: e instanceof Error ? e.message : "validation failed" };
    }
}

/**
 * Bare liveness probe. Returns ONLY {ok:true}. No timestamps, no env names,
 * no Firebase project IDs (closes Trinetra finding "GET handler exposes
 * liveness information" — anything more verbose helps recon).
 */
export async function GET() {
    return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
    // ── 1. Read raw body once, use for both signature check and JSON parse ─
    const rawBody = await req.text();
    const providedSig = req.headers.get("x-emqx-signature");

    // Best-effort peek at device_id BEFORE signature check, so we can tell
    // whether this is an attack-demo payload (STATION-ATTACK-DEMO).
    let peekedDeviceId: string | undefined;
    let peekedFlagsRetain = false;
    try {
        const peek = JSON.parse(rawBody) as Record<string, unknown>;
        if (typeof peek.device_id === "string") peekedDeviceId = peek.device_id;
        const flags = peek.flags as Record<string, unknown> | undefined;
        peekedFlagsRetain = flags?.retain === true;
    } catch { /* peek is optional */ }
    const isDemo = peekedDeviceId === DEMO_DEVICE_ID;

    // ── 2. Signature guard ──────────────────────────────────────────
    const sigDecision = checkWebhookSignature(rawBody, providedSig);
    if (!sigDecision.accepted) {
        try {
            await logSecurityEvent({
                type: "emqx_webhook_unsigned_or_bad_signature",
                severity: "high",
                source: "real_request",
                summary: `EMQX webhook rejected: ${sigDecision.reason}.`,
                target: { route: "/api/emqx-webhook" },
                extra: { detail: sigDecision.detail },
            });
        } catch { /* logging must not block the response */ }
        if (isDemo) {
            await logWebhookSpoofAttempt({
                blocked: true,
                reason: sigDecision.reason,
                detail: sigDecision.detail,
                guard_enabled: WEBHOOK_GUARD_ENABLED,
            });
        }
        return NextResponse.json(
            { success: false, error: "Unauthorized." },
            { status: 401 },
        );
    }
    // Audit trail when the guard is DISABLED — surfaces the BEFORE state in
    // the Live Alerts feed so the demo doesn't look like a no-op.
    if (sigDecision.reason === "guard_disabled") {
        try {
            await logSecurityEvent({
                type: "emqx_webhook_guard_disabled_accepted",
                severity: "critical",
                source: "real_request",
                summary: "Webhook guard is DISABLED — unsigned payload accepted (M11 BEFORE state).",
                target: { route: "/api/emqx-webhook" },
            });
        } catch { /* never throw from logging */ }
        if (isDemo) {
            await logWebhookSpoofAttempt({
                blocked: false,
                reason: "guard_disabled_payload_would_persist",
                guard_enabled: false,
            });
        }
    }

    // ── 2.5. Payload-size cap (M7 defense) ──────────────────────────
    if (PAYLOAD_SIZE_CAP_ENABLED && rawBody.length > PAYLOAD_SIZE_CAP_BYTES) {
        try {
            await logSecurityEvent({
                type: "emqx_webhook_oversized_payload",
                severity: "high",
                source: "real_request",
                summary: `EMQX webhook rejected ${rawBody.length}-byte payload (cap=${PAYLOAD_SIZE_CAP_BYTES}).`,
                target: { route: "/api/emqx-webhook" },
            });
        } catch { /* never throw from logging */ }
        if (isDemo) {
            await logOversizedPayloadAttempt({
                blocked: true,
                reason: "payload_exceeds_cap",
                payload_size: rawBody.length,
                guard_enabled: true,
            });
        }
        return NextResponse.json(
            { success: false, error: "Payload too large." },
            { status: 413 },
        );
    }
    // BEFORE-state mirror for M7: cap disabled AND payload is oversized.
    if (isDemo && !PAYLOAD_SIZE_CAP_ENABLED && rawBody.length > PAYLOAD_SIZE_CAP_BYTES) {
        await logOversizedPayloadAttempt({
            blocked: false,
            reason: "cap_disabled_oversized_payload_would_persist",
            payload_size: rawBody.length,
            guard_enabled: false,
        });
    }

    // ── 3. Parse + validate ─────────────────────────────────────────
    let parsed: unknown;
    try {
        parsed = JSON.parse(rawBody);
    } catch {
        return NextResponse.json(
            { success: false, error: "Bad request." },
            { status: 400 },
        );
    }

    // ── 3.5. Retained-message reject (M5 defense) ───────────────────
    // EMQX rule engine can pass flags.retain in the body when configured
    // with: SELECT payload, topic, flags FROM "stations/+/telemetry"
    // A retained message is a replay — drop it.
    if (REJECT_RETAINED_ENABLED && typeof parsed === "object" && parsed !== null) {
        const p = parsed as Record<string, unknown>;
        const flags = p.flags as Record<string, unknown> | undefined;
        if (flags?.retain === true) {
            try {
                await logSecurityEvent({
                    type: "emqx_webhook_retained_dropped",
                    severity: "high",
                    source: "real_request",
                    summary: "EMQX webhook dropped a retained message — possible poisoning attempt.",
                    target: { route: "/api/emqx-webhook" },
                });
            } catch { /* never throw from logging */ }
            if (isDemo) {
                await logRetainedPoisonAttempt({
                    blocked: true,
                    reason: "retained_flag_rejected",
                    guard_enabled: true,
                });
            }
            return NextResponse.json(
                { success: false, error: "Retained messages rejected." },
                { status: 400 },
            );
        }
    }
    // BEFORE-state mirror for M5: reject disabled AND payload is retained.
    if (isDemo && !REJECT_RETAINED_ENABLED && peekedFlagsRetain) {
        await logRetainedPoisonAttempt({
            blocked: false,
            reason: "reject_disabled_retained_payload_would_persist",
            guard_enabled: false,
        });
    }

    const validation = validateTelemetry(parsed);
    if (!validation.ok) {
        try {
            await logSecurityEvent({
                type: "emqx_webhook_invalid_payload",
                severity: "medium",
                source: "real_request",
                summary: `EMQX webhook rejected: ${validation.reason}`,
                target: { route: "/api/emqx-webhook" },
            });
        } catch {
            /* logging must not block the response */
        }
        return NextResponse.json(
            { success: false, error: "Bad request." },
            { status: 400 },
        );
    }
    const payload = validation.data;

    // ── 3.7. MQTT crypto chain (M16 replay / M17 HMAC / M18 AES) ────
    // Scoped to STATION-ATTACK-DEMO so production telemetry is unaffected.
    // Each guard always RUNS its check so we can log BEFORE-state mirrors;
    // ENFORCEMENT is gated by the toggle above.
    if (isDemo) {
        const providedMic = req.headers.get(MQTT_HMAC_HEADER);

        // M16 — Replay
        const replayDecision = mqttReplayCheck(payload.device_id, payload.timestamp, payload.nonce);
        if (!replayDecision.ok && MQTT_REPLAY_GUARD_ENABLED) {
            await logMqttReplayAttempt({
                blocked: true,
                reason: replayDecision.reason,
                detail: replayDecision.detail,
                guard_enabled: true,
            });
            await logSecurityEvent({
                type: "mqtt_replay_blocked",
                severity: "critical",
                source: "real_request",
                summary: `M16 — replay rejected: ${replayDecision.reason}.`,
                target: { route: "/api/emqx-webhook" },
            });
            return NextResponse.json({ success: false, error: "Replay detected." }, { status: 409 });
        }
        if (!replayDecision.ok && !MQTT_REPLAY_GUARD_ENABLED) {
            await logMqttReplayAttempt({
                blocked: false,
                reason: `guard_disabled_${replayDecision.reason}`,
                detail: replayDecision.detail,
                guard_enabled: false,
            });
            await logSecurityEvent({
                type: "mqtt_replay_accepted",
                severity: "info",
                source: "real_request",
                summary: `M16 — replay guard disabled; ${replayDecision.reason} payload would persist.`,
                target: { route: "/api/emqx-webhook" },
            });
        }

        // M17 — Per-device HMAC over raw body
        const hmacDecision = mqttHmacCheck(payload.device_id, rawBody, providedMic);
        if (!hmacDecision.ok && MQTT_HMAC_GUARD_ENABLED) {
            await logMqttInjectionAttempt({
                blocked: true,
                reason: hmacDecision.reason,
                detail: hmacDecision.detail,
                guard_enabled: true,
            });
            await logSecurityEvent({
                type: "mqtt_injection_blocked",
                severity: "critical",
                source: "real_request",
                summary: `M17 — packet injection rejected: ${hmacDecision.reason}.`,
                target: { route: "/api/emqx-webhook" },
            });
            return NextResponse.json({ success: false, error: "Bad MIC." }, { status: 401 });
        }
        if (!hmacDecision.ok && !MQTT_HMAC_GUARD_ENABLED) {
            await logMqttInjectionAttempt({
                blocked: false,
                reason: `guard_disabled_${hmacDecision.reason}`,
                detail: hmacDecision.detail,
                guard_enabled: false,
            });
            await logSecurityEvent({
                type: "mqtt_injection_accepted",
                severity: "info",
                source: "real_request",
                summary: `M17 — HMAC guard disabled; unsigned payload would persist.`,
                target: { route: "/api/emqx-webhook" },
            });
        }

        // M18 — AES eavesdropping protection (require encrypted envelope)
        const aesDecision = mqttAesCheck(parsed as Record<string, unknown>);
        if (!aesDecision.ok && MQTT_AES_REQUIRED) {
            await logMqttPlaintextAttempt({
                blocked: true,
                reason: aesDecision.reason,
                detail: aesDecision.detail,
                guard_enabled: true,
            });
            await logSecurityEvent({
                type: "mqtt_plaintext_blocked",
                severity: "critical",
                source: "real_request",
                summary: `M18 — plaintext payload rejected.`,
                target: { route: "/api/emqx-webhook" },
            });
            return NextResponse.json({ success: false, error: "AES required." }, { status: 400 });
        }
        if (!aesDecision.ok && !MQTT_AES_REQUIRED) {
            await logMqttPlaintextAttempt({
                blocked: false,
                reason: `guard_disabled_plaintext_accepted`,
                detail: aesDecision.detail,
                guard_enabled: false,
            });
            await logSecurityEvent({
                type: "mqtt_plaintext_accepted",
                severity: "info",
                source: "real_request",
                summary: `M18 — AES not required; plaintext payload would be sniffable.`,
                target: { route: "/api/emqx-webhook" },
            });
        }
    }

    // ── 4. Persist ───────────────────────────────────────────────────
    // Demo payloads (STATION-ATTACK-DEMO) are NEVER written to RTDB —
    // the dedicated mqtt*Attempts Firestore collections above already
    // captured the evidence, and skipping the writes here keeps the live
    // Bresser tile on the dashboard untouched during before/after demos.
    if (isDemo) {
        return NextResponse.json({ success: true, demo: true, logged_to: "mqtt*Attempts" });
    }

    try {
        const topic = `stations/${payload.device_id}/telemetry`;
        const now = Date.now();

        // (a) Dashboard-compatible single-root write — the existing
        // useWeatherData hook reads `weather_station/{payload, ...}`.
        // Last-write-wins; fine for the live tile.
        await adminDatabase.ref("weather_station").set({
            payload,
            receivedAt: now,
            topic,
        });

        // (b) Per-device archive so multi-station dashboards / future
        // analytics can pivot by station_id without race conditions.
        await adminDatabase.ref(`stations/${payload.device_id}/latest`).set({
            payload,
            receivedAt: now,
            topic,
        });

        // Firestore archival — every 20 minutes per device.
        const metaRef = adminFirestore
            .collection("system")
            .doc(`weather_${payload.device_id}`);
        const metaDoc = await metaRef.get();
        const lastSaved = metaDoc.exists ? metaDoc.data()?.lastSaved ?? 0 : 0;
        if (now - lastSaved >= 20 * 60 * 1000) {
            await adminFirestore.collection("readings").add({
                ...payload,
                receivedAt: new Date(),
            });
            await metaRef.set({ lastSaved: now });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        // Log the real error server-side only. Return generic to client
        // (closes Trinetra finding "verbose errors leak internal details").
        console.error("EMQX Webhook Error:", error);
        try {
            await logSecurityEvent({
                type: "emqx_webhook_persist_failed",
                severity: "high",
                source: "system",
                summary: "EMQX webhook handler crashed during persist.",
                extra: {
                    err: error instanceof Error ? error.message : String(error),
                },
            });
        } catch {
            /* never throw from logging */
        }
        return NextResponse.json(
            { success: false, error: "Internal error." },
            { status: 500 },
        );
    }
}
