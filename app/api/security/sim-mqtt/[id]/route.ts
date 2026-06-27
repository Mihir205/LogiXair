/**
 * Simulator endpoints for broker-level MQTT attacks (M1, M3).
 *
 * EMQX Cloud Serverless does not expose the allow_anonymous or per-clientid
 * ACL toggles at runtime, so M1 / M3 cannot be reproduced by flipping a
 * real broker setting the way M5/M7/M11 are reproduced by flipping a
 * webhook code constant. To keep the same demo workflow (toggle + script
 * + Firestore collection + Sentinel alert) these endpoints simulate the
 * broker's decision behind a local code toggle.
 *
 * Each call:
 *   - Reads the toggle below.
 *   - Logs to the dedicated mqtt*Attempts Firestore collection.
 *   - Emits a security_event with the type prefix the Sentinel already
 *     buckets (mqtt_anon_connect_* / mqtt_cross_station_*).
 *
 * Toggles (FLIP for before/after screenshots):
 */
import { NextResponse } from "next/server";
import { logSecurityEvent } from "@/lib/security/logSecurityEvent";
import {
    logAnonConnectAttempt,
    logCrossStationPublishAttempt,
} from "@/lib/security/mqttAttemptLogger";

// FLIP FOR BEFORE/AFTER anonymous-CONNECT (M1) screenshots.
export const BROKER_ANON_GUARD_ENABLED = true;

// FLIP FOR BEFORE/AFTER cross-station-publish (M3) screenshots.
export const BROKER_CROSS_STATION_ACL_ENABLED = false;

function stationFromTopic(topic: string): string | null {
    const m = topic.match(/^stations\/([A-Z0-9_-]+)\/telemetry$/i);
    return m ? m[1] : null;
}

export async function POST(
    req: Request,
    ctx: { params: Promise<{ id: string }> },
) {
    const { id } = await ctx.params;
    let body: Record<string, unknown> = {};
    try {
        body = await req.json();
    } catch { /* allow empty body */ }

    if (id === "M1") {
        if (BROKER_ANON_GUARD_ENABLED) {
            await logAnonConnectAttempt({
                blocked: true,
                reason: "anonymous_connect_denied",
                detail: "Simulated broker rejected CONNECT with no username/password.",
                guard_enabled: true,
            });
            await logSecurityEvent({
                type: "mqtt_anon_connect_blocked",
                severity: "critical",
                source: "real_request",
                summary: "M1 — active defense detected and rejected anonymous CONNECT attempt.",
                target: { route: "/api/security/sim-mqtt/M1" },
            });
            return NextResponse.json(
                { success: false, blocked: true, error: "Anonymous CONNECT denied." },
                { status: 401 },
            );
        } else {
            await logAnonConnectAttempt({
                blocked: false,
                reason: "guard_disabled_anon_accepted",
                detail: "Simulated broker would accept CONNECT with no credentials.",
                guard_enabled: false,
            });
            await logSecurityEvent({
                type: "mqtt_anon_connect_accepted",
                severity: "info",
                source: "real_request",
                summary: "M1 — broker in vulnerable state (guard disabled); anonymous CONNECT accepted.",
                target: { route: "/api/security/sim-mqtt/M1" },
            });
            return NextResponse.json({ success: true, blocked: false, demo: true });
        }
    }

    if (id === "M3") {
        const actingClientId = String(body.acting_clientid ?? "");
        const targetTopic = String(body.target_topic ?? "");
        const victim = stationFromTopic(targetTopic);
        const isCrossStation = victim !== null && actingClientId !== "" && victim !== actingClientId;

        if (!isCrossStation) {
            return NextResponse.json(
                { success: false, error: "Payload must show acting_clientid publishing to a foreign stations/<id>/telemetry topic." },
                { status: 400 },
            );
        }

        if (BROKER_CROSS_STATION_ACL_ENABLED) {
            await logCrossStationPublishAttempt({
                blocked: true,
                reason: "acl_denied",
                detail: `Simulated ACL denied ${actingClientId} → ${targetTopic}.`,
                payload: { acting_clientid: actingClientId, target_topic: targetTopic, victim },
                guard_enabled: true,
            });
            await logSecurityEvent({
                type: "mqtt_cross_station_publish_blocked",
                severity: "critical",
                source: "real_request",
                summary: `M3 — active defense detected cross-station hijack attempt: ${actingClientId} → ${targetTopic}. Blocked.`,
                target: { route: "/api/security/sim-mqtt/M3" },
            });
            return NextResponse.json(
                { success: false, blocked: true, error: "ACL denied cross-station publish." },
                { status: 403 },
            );
        } else {
            await logCrossStationPublishAttempt({
                blocked: false,
                reason: "acl_disabled_foreign_publish_accepted",
                detail: `Simulated ACL would accept ${actingClientId} → ${targetTopic}.`,
                payload: { acting_clientid: actingClientId, target_topic: targetTopic, victim },
                guard_enabled: false,
            });
            await logSecurityEvent({
                type: "mqtt_cross_station_publish_accepted",
                severity: "info",
                source: "real_request",
                summary: `M3 — ACL in vulnerable state (disabled); ${actingClientId} would hijack ${victim}'s topic.`,
                target: { route: "/api/security/sim-mqtt/M3" },
            });
            return NextResponse.json({ success: true, blocked: false, demo: true });
        }
    }

    return NextResponse.json(
        { success: false, error: `Unknown sim id: ${id}` },
        { status: 404 },
    );
}
