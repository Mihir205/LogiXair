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
import { checkWebhookSignature } from "@/lib/security/emqxWebhookGuard";
import { logSecurityEvent } from "@/lib/security/logSecurityEvent";

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
]);

type TelemetryPayload = {
    device_id: string;
    temperature: number;
    humidity: number;
    pressure?: number;
    rainfall?: number;
    wind_speed?: number;
    wind_avg_ms?: number;
    wind_max_ms?: number;
    wind_direction?: number;
    light_intensity?: number;
    irradiance?: number;
    panel_current_a?: number;
    battery?: string;
    rssi?: number;
    station_id?: string;
    sensor_id?: number;
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

    // Bresser 5-in-1 stations send wind_direction under either name, and
    // rainfall/wind_speed under their Bresser-native aliases too — accept
    // whichever the publisher used.
    const windDirectionRaw = r.wind_direction ?? r.wind_dir;
    const rainfallRaw = r.rainfall ?? r.rain;

    try {
        const data: TelemetryPayload = {
            device_id: r.device_id,
            temperature: t.v,
            humidity: h.v,
            pressure: optional(r.pressure, 800, 1200, "pressure"),
            rainfall: optional(rainfallRaw, 0, 500, "rainfall"),
            wind_speed: optional(r.wind_speed, 0, 100, "wind_speed"),
            wind_avg_ms: optional(r.wind_avg_ms, 0, 100, "wind_avg_ms"),
            wind_max_ms: optional(r.wind_max_ms, 0, 100, "wind_max_ms"),
            wind_direction: optional(windDirectionRaw, 0, 360, "wind_direction"),
            light_intensity: optional(r.light_intensity, 0, 200000, "light_intensity"),
            irradiance: optional(r.irradiance, 0, 1500, "irradiance"),
            panel_current_a: optional(r.panel_current_a, -20, 20, "panel_current_a"),
            battery: typeof r.battery === "string" ? r.battery : undefined,
            rssi: optional(r.rssi, -150, 0, "rssi"),
            station_id: typeof r.station_id === "string" ? r.station_id : undefined,
            sensor_id: typeof r.sensor_id === "number" ? r.sensor_id : undefined,
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
        } catch {
            /* logging must not block the response */
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
        return NextResponse.json(
            { success: false, error: "Payload too large." },
            { status: 413 },
        );
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
            return NextResponse.json(
                { success: false, error: "Retained messages rejected." },
                { status: 400 },
            );
        }
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

    // ── 4. Persist ───────────────────────────────────────────────────
    try {
        const topic = `stations/${payload.device_id}/telemetry`;
        const now = Date.now();

        // Firebase RTDB rejects `undefined` values. Optional fields the
        // publisher didn't send (pressure, rainfall, etc.) come through as
        // undefined from validateTelemetry — strip them before persisting.
        const cleanPayload = Object.fromEntries(
            Object.entries(payload).filter(([, v]) => v !== undefined),
        ) as TelemetryPayload;

        // (a) Dashboard-compatible single-root write — the existing
        // useWeatherData hook reads `weather_station/{payload, ...}`.
        // Last-write-wins; fine for the live tile.
        await adminDatabase.ref("weather_station").set({
            payload: cleanPayload,
            receivedAt: now,
            topic,
        });

        // (b) Per-device archive so multi-station dashboards / future
        // analytics can pivot by station_id without race conditions.
        await adminDatabase.ref(`stations/${cleanPayload.device_id}/latest`).set({
            payload: cleanPayload,
            receivedAt: now,
            topic,
        });

        // Firestore archival — every 20 minutes per device.
        const metaRef = adminFirestore
            .collection("system")
            .doc(`weather_${cleanPayload.device_id}`);
        const metaDoc = await metaRef.get();
        const lastSaved = metaDoc.exists ? metaDoc.data()?.lastSaved ?? 0 : 0;
        if (now - lastSaved >= 20 * 60 * 1000) {
            await adminFirestore.collection("readings").add({
                ...cleanPayload,
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
