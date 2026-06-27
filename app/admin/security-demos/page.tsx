"use client";

/**
 * Cybersecurity Demos — admin-only page.
 *
 * View-only Sentinel surface. There is no "Run Attack" button — every
 * attack is reproduced from the terminal via the toggle-based scripts
 * under  attacks/M*  and the Sentinel + alert feed below detect and
 * surface them automatically. Capture before/after screenshots from
 * the terminal output + this dashboard.
 */
import { useState } from "react";
import RouteGuard from "../../components/RouteGuard";
import AuthGuard from "../../components/AuthGuard";
import DashboardLayout from "../../components/DashboardLayout";
import {
    ShieldAlert,
    BellRing,
    CheckCircle2,
    Radar,
    Brain,
    Trash2,
    Loader2,
} from "lucide-react";
import { auth } from "../../../lib/firebase";
import useSecurityEvents, { SecurityEvent } from "../../../lib/useSecurityEvents";
import useSecuritySentinel, { type IdsAlert } from "../../../lib/useSecuritySentinel";

export default function SecurityDemosPage() {
    return (
        <AuthGuard>
            <RouteGuard allowedRole="admin">
                <DashboardLayout role="admin">
                    <SecurityDemos />
                </DashboardLayout>
            </RouteGuard>
        </AuthGuard>
    );
}

function SecurityDemos() {
    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Cybersecurity Demos
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                        Live attack/defense reproductions. Trigger attacks from
                        the terminal scripts under <code className="font-mono text-[11px]">attacks/M*</code>;
                        the Sentinel and the alert feed below detect and surface
                        them automatically.
                    </p>
                </div>
                <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <ShieldAlert size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                        Security Layer
                    </span>
                </div>
            </header>

            <SentinelStatus />

            <IdsPanel />

            <AlertsFeed />

            <FooterLegend />
        </div>
    );
}

function SentinelStatus() {
    const { report, error, busy } = useSecuritySentinel(30_000);

    const lastDeletions = report?.deleted ?? [];
    const rogueNodes = report?.rogueNodeAttempts ?? [];
    const jamming = report?.jammingSuspects ?? [];
    const mqttIncidents = (report?.mqttIncidents ?? []).filter((b) => b.count > 0);
    const totalMqtt = mqttIncidents.reduce((n, b) => n + b.count, 0);
    const anyActivity = lastDeletions.length > 0 || rogueNodes.length > 0 || jamming.length > 0 || totalMqtt > 0;
    const tone =
        error
            ? "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300"
            : anyActivity
                ? "border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300"
                : "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300";

    return (
        <div className={`rounded-xl border p-4 flex flex-col gap-3 ${tone}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Radar size={16} className={busy ? "animate-spin" : ""} />
                    <h2 className="text-sm font-bold tracking-tight">
                        Auto-Defense Sentinel
                    </h2>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider opacity-70">
                    polls every 30s · GET /api/security/sentinel
                </span>
            </div>
            {error ? (
                <p className="text-xs">Sentinel error: {error}</p>
            ) : report == null ? (
                <p className="text-xs">Connecting…</p>
            ) : (
                <div className="text-xs space-y-2">
                    <p>
                        Last sweep at {report.runAt.toLocaleTimeString()} — scanned{" "}
                        <strong>{report.scannedUsers}</strong> users +{" "}
                        <strong>{rogueNodes.length}</strong> rogue LoRa +{" "}
                        <strong>{totalMqtt}</strong> MQTT incidents (last{" "}
                        {Math.floor((report.rogueNodeWindowSec ?? 300) / 60)} min) in{" "}
                        <strong>{report.durationMs} ms</strong>.
                    </p>

                    {lastDeletions.length > 0 && (
                        <div>
                            <p className="font-bold">Quarantined accounts:</p>
                            <ul className="font-mono space-y-1 mt-1">
                                {lastDeletions.map((d) => (
                                    <li key={d.uid}>🗑️ {d.email} — {d.reason}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {rogueNodes.length > 0 && (
                        <div>
                            <p className="font-bold">Rogue LoRa devices blocked:</p>
                            <ul className="font-mono space-y-1 mt-1">
                                {rogueNodes.slice(0, 5).map((n, i) => (
                                    <li key={`${n.device_id}-${n.blockedAt}-${i}`}>
                                        📡 <strong>{n.device_id}</strong> — {n.reason}{" "}
                                        <span className="opacity-70">
                                            at {new Date(n.blockedAt).toLocaleTimeString()}
                                        </span>
                                    </li>
                                ))}
                                {rogueNodes.length > 5 && (
                                    <li className="opacity-70">…and {rogueNodes.length - 5} more</li>
                                )}
                            </ul>
                        </div>
                    )}

                    {jamming.length > 0 && (
                        <div>
                            <p className="font-bold">
                                Possible jamming / link loss (silent &gt;{" "}
                                {report.jammingThresholdSec ?? 30}s):
                            </p>
                            <ul className="font-mono space-y-1 mt-1">
                                {jamming.slice(0, 5).map((j) => (
                                    <li key={j.device_id}>
                                        📵 <strong>{j.device_id}</strong> — silent{" "}
                                        {j.silent_for_sec}s, last seen{" "}
                                        {new Date(j.last_seen_iso).toLocaleTimeString()}
                                    </li>
                                ))}
                                {jamming.length > 5 && (
                                    <li className="opacity-70">…and {jamming.length - 5} more</li>
                                )}
                            </ul>
                        </div>
                    )}

                    {mqttIncidents.length > 0 && (
                        <div>
                            <p className="font-bold">
                                MQTT incidents (last{" "}
                                {Math.floor((report.mqttIncidentWindowSec ?? 300) / 60)} min):
                            </p>
                            <ul className="font-mono space-y-1 mt-1">
                                {mqttIncidents.map((b) => (
                                    <li key={b.type_prefix}>
                                        {b.severity === "critical" ? "🚨" : "⚠️"}{" "}
                                        <strong>{b.count}×</strong> {b.label}
                                        {b.latest_iso && (
                                            <span className="opacity-70">
                                                {" "}— latest {new Date(b.latest_iso).toLocaleTimeString()}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {!anyActivity && <p className="opacity-80">No rogue activity detected.</p>}
                </div>
            )}
        </div>
    );
}

function IdsPanel() {
    const { report } = useSecuritySentinel(30_000);
    const fired = report?.idsAlertsFiredThisSweep ?? [];
    const recent = report?.idsAlertsRecent ?? [];
    const [clearing, setClearing] = useState(false);
    const [clearMsg, setClearMsg] = useState<string | null>(null);
    const tone = fired.length > 0
        ? "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30"
        : recent.length > 0
            ? "border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30"
            : "border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900";

    async function clearAll() {
        if (!confirm("Delete every doc in idsAlerts? This cannot be undone.")) return;
        setClearing(true);
        setClearMsg(null);
        try {
            const user = auth.currentUser;
            if (!user) { setClearMsg("Not signed in."); return; }
            const token = await user.getIdToken();
            const res = await fetch("/api/security/ids-clear", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setClearMsg(`Failed: ${(data as { error?: string }).error ?? res.status}`);
            } else {
                setClearMsg(`Cleared ${(data as { deleted?: number }).deleted ?? 0} alerts. Refresh in 30s for sweep update.`);
            }
        } catch (e) {
            setClearMsg(`Failed: ${e instanceof Error ? e.message : "unknown"}`);
        } finally {
            setClearing(false);
        }
    }

    return (
        <div className={`rounded-xl border p-4 ${tone}`}>
            <div className="flex items-center justify-between mb-3 gap-3">
                <div className="flex items-center gap-2">
                    <Brain size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                        Lightweight IDS — rate / pattern / trend rules
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={clearAll}
                        disabled={clearing}
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Delete every idsAlerts doc"
                    >
                        {clearing ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                        Clear all
                    </button>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        refs [8] [9] [10] [11] · idsAlerts collection
                    </span>
                </div>
            </div>
            {clearMsg && (
                <p className="text-[11px] mb-2 text-slate-600 dark:text-slate-400">{clearMsg}</p>
            )}

            {fired.length > 0 && (
                <div className="mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 mb-1">
                        Fired this sweep ({fired.length}):
                    </p>
                    <ul className="space-y-1">
                        {fired.map((a) => <IdsRow key={a.rule_id + a.detected_at} alert={a} fresh />)}
                    </ul>
                </div>
            )}

            {recent.length > 0 ? (
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        Recent IDS alerts ({recent.length}):
                    </p>
                    <ul className="space-y-1">
                        {recent.map((a) => <IdsRow key={a.rule_id + a.detected_at} alert={a} />)}
                    </ul>
                </div>
            ) : fired.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    No IDS rules have fired. Run an attack 3+ times in 60s to trip a rate rule, or stage a rogue-node + anon-CONNECT combo for the coordinated-recon pattern.
                </p>
            )}
        </div>
    );
}

function IdsRow({ alert, fresh }: { alert: IdsAlert; fresh?: boolean }) {
    const sevColor = alert.severity === "critical"
        ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60"
        : alert.severity === "high"
            ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60"
            : "text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60";
    const time = alert.detected_at ? new Date(alert.detected_at).toLocaleTimeString() : "—";
    return (
        <li className={`flex items-start gap-2 text-xs px-2 py-1.5 rounded ${fresh ? "ring-1 ring-rose-300" : ""}`}>
            <span className={`mt-0.5 inline-flex items-center text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border ${sevColor}`}>
                {alert.severity}
            </span>
            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 mt-1 shrink-0">{alert.rule_kind}</span>
            <span className="flex-1 text-slate-800 dark:text-slate-200">{alert.message}</span>
            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 mt-1 shrink-0">{time}</span>
        </li>
    );
}

function AlertsFeed() {
    const { events, loading, error } = useSecurityEvents(20);
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <BellRing size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                        Live Security Alerts
                    </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Realtime · Firestore security_events
                </span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && <FeedRow muted>Connecting to event stream…</FeedRow>}
                {error && (
                    <FeedRow danger>
                        Could not read security_events: {error}
                        <br />
                        <span className="opacity-70">
                            Likely cause: Firestore rules block reads on this collection.
                            See firestore.rules.example in the repo root.
                        </span>
                    </FeedRow>
                )}
                {!loading && !error && events.length === 0 && (
                    <FeedRow muted>
                        No events yet. Run a script under <code className="font-mono text-[11px]">attacks/M*</code> to generate one.
                    </FeedRow>
                )}
                {events.map((e) => (
                    <AlertRow key={e.id} evt={e} />
                ))}
            </div>
        </div>
    );
}

function AlertRow({ evt }: { evt: SecurityEvent }) {
    const sev = evt.severity;
    const sevColor =
        sev === "critical"
            ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60"
            : sev === "high"
                ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60"
                : sev === "info"
                    ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60"
                    : "text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60";

    const time = evt.timestamp?.toDate?.();
    const timeStr = time
        ? time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : "—";

    return (
        <div className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
            <span
                className={`mt-0.5 inline-flex items-center text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border ${sevColor}`}
            >
                {sev}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                    {evt.summary}
                </p>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span>{timeStr}</span>
                    <span>type:{evt.type}</span>
                    <span>source:{evt.source}</span>
                    {evt.cleanedUp && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={10} /> cleaned up
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

function FeedRow({
    children,
    muted,
    danger,
}: {
    children: React.ReactNode;
    muted?: boolean;
    danger?: boolean;
}) {
    return (
        <div
            className={`px-5 py-4 text-xs ${
                danger
                    ? "text-rose-600 dark:text-rose-400"
                    : muted
                        ? "text-slate-400 dark:text-slate-500"
                        : "text-slate-700 dark:text-slate-300"
            }`}
        >
            {children}
        </div>
    );
}

function FooterLegend() {
    return (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <p>
                <strong>How to read this:</strong> run a toggle-based attack
                script from the terminal (e.g.{" "}
                <code className="font-mono text-[11px]">.\attacks\M11_webhook_no_signature\attack.ps1</code>).
                The Sentinel sweeps every 30s and the alert feed streams events
                in real time from Firestore. Flip the toggle in code, rerun the
                script, and capture before/after pairs from the terminal output
                plus this page.
            </p>
        </div>
    );
}
