/**
 * Legacy weather ingest endpoint.
 *
 * SECURITY: previously this route accepted ANY unauthenticated POST and wrote
 * it straight into Realtime DB — a data-poisoning / quota-burn hole. Nothing
 * in the app reads `weather/{stationId}` (the live path is weather_station,
 * fed by /api/emqx-webhook), so this is retained only for backward-compat and
 * is now locked behind the shared webhook token + strict physical-bounds
 * validation. Unsigned or out-of-range posts are rejected.
 */
import { NextResponse } from "next/server";
import { adminDatabase } from "@/lib/firebaseAdmin";
import { checkWebhookSignature } from "@/lib/security/emqxWebhookGuard";
import { logSecurityEvent } from "@/lib/security/logSecurityEvent";

// Physical sanity bounds — reject anything outside a real sensor's range.
const BOUNDS: Record<string, [number, number]> = {
  temperature: [-60, 65],
  humidity: [0, 100],
  pressure: [800, 1100],
  rain: [0, 500],
  light: [0, 200000],
  wind_direction: [0, 360],
  irradiance: [0, 1500],
};

function inBounds(key: string, v: unknown): boolean {
  if (v === undefined || v === null) return true; // optional field
  if (typeof v !== "number" || Number.isNaN(v)) return false;
  const b = BOUNDS[key];
  return !b || (v >= b[0] && v <= b[1]);
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    // ── Layer 2a: authenticity (shared token, same as EMQX webhook) ──
    const token = req.headers.get("x-webhook-token");
    const sig = req.headers.get("x-emqx-signature");
    const decision = checkWebhookSignature(rawBody, sig, token);
    if (!decision.accepted) {
      try {
        await logSecurityEvent({
          type: "weather_ingest_unauthorized",
          severity: "high",
          source: "real_request",
          summary: "Unauthenticated POST to legacy /api/weather-ingest blocked.",
          target: { route: "/api/weather-ingest" },
        });
      } catch { /* non-fatal */ }
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, any>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    // ── Layer 2b: input validation ──
    const stationId = String(body.stationId ?? "station_001").slice(0, 64).replace(/[^\w-]/g, "");
    for (const key of Object.keys(BOUNDS)) {
      if (!inBounds(key, body[key])) {
        return NextResponse.json(
          { success: false, error: `Field ${key} out of range` },
          { status: 400 },
        );
      }
    }

    await adminDatabase.ref(`weather/${stationId}`).set({
      temperature: body.temperature ?? null,
      humidity: body.humidity ?? null,
      pressure: body.pressure ?? null,
      rain: body.rain ?? null,
      light: body.light ?? null,
      wind_direction: body.wind_direction ?? null,
      irradiance: body.irradiance ?? null,
      timestamp: body.timestamp ?? null,
      lastUpdated: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch {
    // Generic error — never leak internals.
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
