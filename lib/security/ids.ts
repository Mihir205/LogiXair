/**
 * Lightweight IDS over `security_events`.
 *
 * Runs inside the Sentinel sweep. Reads recent events, applies a small
 * set of rate / pattern / trend rules, and emits an `idsAlerts` Firestore
 * doc + a high-severity security_event when any rule fires. The Sentinel
 * UI surfaces idsAlerts as a separate panel so an operator can tell
 * "many events" from "actively correlated attack" at a glance.
 *
 * Refs: [8] Musthafa et al., [9] Zhang et al., [10] Adewole et al.,
 *       [11] Kikissagbe & Adda, [12] Kethineni & Gera (anomaly).
 *
 * Why heuristic, not ML: a 100-line rules engine you can audit beats a
 * black-box model you can't justify in a project report. The hooks below
 * are the obvious ML upgrade points.
 */
import { adminFirestore, adminDatabase } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { logSecurityEvent } from "@/lib/security/logSecurityEvent";

export type IdsAlert = {
    rule_id: string;
    rule_kind: "rate" | "pattern" | "trend";
    severity: "critical" | "high" | "medium";
    message: string;
    count?: number;
    metric?: Record<string, unknown>;
    detected_at: string;
};

const SCAN_WINDOW_MS = 60 * 1000;
const PATTERN_WINDOW_MS = 30 * 1000;
const DEDUPE_WINDOW_MS = 60 * 1000;

type Rule = {
    id: string;
    kind: "rate" | "pattern" | "trend";
    severity: "critical" | "high" | "medium";
} & (
    | {
          kind: "rate";
          /** Match an event when its `type` starts with any of these prefixes. */
          prefixes: string[];
          /** Fire when count >= threshold within SCAN_WINDOW_MS. */
          threshold: number;
          label: string;
      }
    | {
          kind: "pattern";
          /** Both prefix groups must each have >=1 event in PATTERN_WINDOW_MS. */
          required_a: string[];
          required_b: string[];
          label: string;
      }
    | {
          kind: "trend";
          /** Inspected externally; this is just metadata. */
          label: string;
      }
);

const RULES: Rule[] = [
    {
        id: "RATE_WEBHOOK_SPOOF",
        kind: "rate",
        severity: "critical",
        prefixes: ["emqx_webhook_unsigned", "emqx_webhook_guard_disabled"],
        threshold: 3,
        label: "Webhook spoof burst",
    },
    {
        id: "RATE_ANON_CONNECT",
        kind: "rate",
        severity: "critical",
        prefixes: ["mqtt_anon_connect"],
        threshold: 3,
        label: "Anonymous CONNECT burst",
    },
    {
        id: "RATE_INJECTION",
        kind: "rate",
        severity: "critical",
        prefixes: ["mqtt_injection", "lora_injection"],
        threshold: 5,
        label: "Packet injection burst",
    },
    {
        id: "RATE_OVERSIZED",
        kind: "rate",
        severity: "high",
        prefixes: ["emqx_webhook_oversized", "mqtt_oversized_payload"],
        threshold: 5,
        label: "Oversized-payload burst (possible DoS)",
    },
    {
        id: "PATTERN_COORDINATED_RECON",
        kind: "pattern",
        severity: "critical",
        required_a: ["rogue_node_blocked", "rogue_node_accepted"],
        required_b: ["mqtt_anon_connect"],
        label: "Coordinated recon: rogue node + anonymous CONNECT in same window",
    },
    {
        id: "TREND_WEATHER_ANOMALY",
        kind: "trend",
        severity: "high",
        label: "Live weather reading outside physical range",
    },
];

type EvtRow = { type: string; ts: number };

async function loadRecentEvents(windowMs: number): Promise<EvtRow[]> {
    const since = Timestamp.fromMillis(Date.now() - windowMs);
    const snap = await adminFirestore
        .collection("security_events")
        .where("timestamp", ">=", since)
        .limit(500)
        .get();
    const out: EvtRow[] = [];
    for (const d of snap.docs) {
        const data = d.data() as { type?: string; timestamp?: Timestamp };
        if (!data.type) continue;
        out.push({ type: data.type, ts: data.timestamp?.toMillis() ?? 0 });
    }
    return out;
}

async function recentlyAlerted(rule_id: string): Promise<boolean> {
    // Single-field where only — avoids needing a composite index on
    // (rule_id, detected_at). Filter the timestamp in memory.
    const cutoff = Date.now() - DEDUPE_WINDOW_MS;
    try {
        const snap = await adminFirestore
            .collection("idsAlerts")
            .where("rule_id", "==", rule_id)
            .limit(10)
            .get();
        for (const d of snap.docs) {
            const ts = (d.data() as { detected_at?: Timestamp }).detected_at;
            if (ts && ts.toMillis() >= cutoff) return true;
        }
        return false;
    } catch {
        return false;
    }
}

async function emit(alert: IdsAlert): Promise<void> {
    try {
        await adminFirestore.collection("idsAlerts").add({
            ...alert,
            detected_at: Timestamp.now(),
        });
    } catch { /* never throw from logger */ }
    try {
        await logSecurityEvent({
            type: "ids_rule_fired",
            severity: alert.severity,
            source: "system",
            summary: `IDS: ${alert.message}`,
            target: { rule_id: alert.rule_id, rule_kind: alert.rule_kind },
            extra: alert.metric,
        });
    } catch { /* never throw */ }
}

function startsWithAny(type: string, prefixes: string[]): boolean {
    for (const p of prefixes) if (type.startsWith(p)) return true;
    return false;
}

/** Inspect RTDB `weather_station/payload` for an out-of-physical-range reading. */
async function checkWeatherAnomaly(): Promise<{
    anomalous: boolean;
    detail?: string;
    payload?: Record<string, unknown>;
}> {
    try {
        const snap = await adminDatabase.ref("weather_station/payload").once("value");
        const payload = snap.val();
        if (!payload || typeof payload !== "object") return { anomalous: false };
        const temp = Number(payload.temperature);
        const hum = Number(payload.humidity);
        const issues: string[] = [];
        if (Number.isFinite(temp) && (temp > 60 || temp < -30)) {
            issues.push(`temperature=${temp}°C outside [-30, 60]`);
        }
        if (Number.isFinite(hum) && (hum > 100 || hum < 0)) {
            issues.push(`humidity=${hum}% outside [0, 100]`);
        }
        if (issues.length === 0) return { anomalous: false };
        return { anomalous: true, detail: issues.join("; "), payload };
    } catch {
        return { anomalous: false };
    }
}

export async function runIdsScan(): Promise<IdsAlert[]> {
    const fired: IdsAlert[] = [];
    let events: EvtRow[] = [];
    try {
        events = await loadRecentEvents(SCAN_WINDOW_MS);
    } catch (e) {
        console.log("[ids] loadRecentEvents failed:", e instanceof Error ? e.message : e);
        return [];
    }
    console.log(`[ids] scan window=${SCAN_WINDOW_MS / 1000}s events=${events.length}`);

    for (const rule of RULES) {
        try {
            if (await recentlyAlerted(rule.id)) continue;
        } catch (e) {
            console.log(`[ids] dedupe check failed for ${rule.id}:`, e instanceof Error ? e.message : e);
            continue;
        }

        if (rule.kind === "rate") {
            const count = events.reduce(
                (n, e) => (startsWithAny(e.type, rule.prefixes) ? n + 1 : n),
                0,
            );
            if (count >= rule.threshold) {
                const alert: IdsAlert = {
                    rule_id: rule.id,
                    rule_kind: "rate",
                    severity: rule.severity,
                    message: `${rule.label} — ${count} events in last ${Math.floor(SCAN_WINDOW_MS / 1000)}s.`,
                    count,
                    metric: { window_sec: Math.floor(SCAN_WINDOW_MS / 1000), threshold: rule.threshold },
                    detected_at: new Date().toISOString(),
                };
                await emit(alert);
                fired.push(alert);
            }
        } else if (rule.kind === "pattern") {
            const recentForPattern = events.filter((e) => Date.now() - e.ts <= PATTERN_WINDOW_MS);
            const hasA = recentForPattern.some((e) => startsWithAny(e.type, rule.required_a));
            const hasB = recentForPattern.some((e) => startsWithAny(e.type, rule.required_b));
            if (hasA && hasB) {
                const alert: IdsAlert = {
                    rule_id: rule.id,
                    rule_kind: "pattern",
                    severity: rule.severity,
                    message: `${rule.label} (within ${Math.floor(PATTERN_WINDOW_MS / 1000)}s).`,
                    metric: { pattern_window_sec: Math.floor(PATTERN_WINDOW_MS / 1000) },
                    detected_at: new Date().toISOString(),
                };
                await emit(alert);
                fired.push(alert);
            }
        } else if (rule.kind === "trend") {
            if (rule.id === "TREND_WEATHER_ANOMALY") {
                const a = await checkWeatherAnomaly();
                if (a.anomalous) {
                    const alert: IdsAlert = {
                        rule_id: rule.id,
                        rule_kind: "trend",
                        severity: rule.severity,
                        message: `${rule.label}: ${a.detail}.`,
                        metric: a.payload,
                        detected_at: new Date().toISOString(),
                    };
                    await emit(alert);
                    fired.push(alert);
                }
            }
        }
    }

    return fired;
}

/** For the UI panel: read latest N idsAlerts ordered desc. */
export async function recentIdsAlerts(limit = 20): Promise<IdsAlert[]> {
    try {
        const snap = await adminFirestore
            .collection("idsAlerts")
            .orderBy("detected_at", "desc")
            .limit(limit)
            .get();
        return snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            const ts = data.detected_at as Timestamp | undefined;
            return {
                rule_id: String(data.rule_id ?? ""),
                rule_kind: (data.rule_kind as IdsAlert["rule_kind"]) ?? "rate",
                severity: (data.severity as IdsAlert["severity"]) ?? "medium",
                message: String(data.message ?? ""),
                count: typeof data.count === "number" ? data.count : undefined,
                metric: data.metric as Record<string, unknown> | undefined,
                detected_at: ts?.toDate().toISOString() ?? "",
            };
        });
    } catch {
        return [];
    }
}
