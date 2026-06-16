"use client";

/**
 * Cybersecurity Demos — admin-only page.
 *
 *  - Top section: attack cards with "Run Attack" buttons.
 *  - Bottom section: real-time alert feed subscribed to Firestore
 *    security_events. New events appear within milliseconds of being
 *    logged by the attack runner or any guarded API route.
 *
 *  When an attack succeeds, the runner auto-cleans the rogue account
 *  and surfaces a "cleaned up" badge on the alert card.
 */
import { useState } from "react";
import RouteGuard from "../../components/RouteGuard";
import AuthGuard from "../../components/AuthGuard";
import DashboardLayout from "../../components/DashboardLayout";
import {
    ShieldAlert,
    ShieldCheck,
    PlayCircle,
    Loader2,
    Lock,
    Bug,
    AlertTriangle,
    Trash2,
    BellRing,
    CheckCircle2,
} from "lucide-react";
import { auth } from "../../../lib/firebase";
import useSecurityEvents, { SecurityEvent } from "../../../lib/useSecurityEvents";
import useSecuritySentinel from "../../../lib/useSecuritySentinel";
import { Radar } from "lucide-react";

type Severity = "critical" | "high" | "medium";
type Classification = "exploited" | "blocked" | "error";

type AttackResult = {
    id: string;
    name: string;
    description: string;
    target: string;
    method: string;
    requestBody?: unknown;
    httpStatus: number;
    responseBody: unknown;
    classification: Classification;
    summary: string;
    durationMs: number;
    cleanup?: { performed: boolean; message: string };
    eventId?: string;
};

type AttackCardConfig = {
    id: string;
    title: string;
    column: string;
    severity: Severity;
    overview: string;
    protectionModule: string;
};

/**
 * Cyber Demos hub policy: only attacks that REQUIRE continuous monitoring
 * (background sentinel scanning for ongoing exploitation attempts) live
 * here. One-shot threats whose protection is statically enforced at the
 * code/route level — XSS sanitiser, clickjack CSP, TLS, replay guard,
 * HMAC — are validated by toggling their constant + a single screenshot,
 * not by a Run Attack button. Adding them here would burn Firestore
 * quota for no extra security value.
 */
const ATTACKS: AttackCardConfig[] = [
    {
        id: "01",
        title: "Unauthenticated Admin Creation",
        column: "Cloud · Insecure API",
        severity: "critical",
        overview:
            "POST /api/admin/create-user accepted anonymous requests. A single curl " +
            "could mint a new Firebase Auth admin account — the request body's " +
            "role field was trusted verbatim. The Sentinel scans every 30s and " +
            "auto-deletes any rogue admin created bypassing this guard.",
        protectionModule: "lib/security/requireAdmin.ts + Sentinel",
    },
    {
        id: "09",
        title: "Rogue Node Join",
        column: "LoRa · Device Registry",
        severity: "high",
        overview:
            "Attacker provisions a brand-new LoRa node with a self-chosen " +
            "device_id and starts publishing telemetry. Without an explicit " +
            "allow-list every fabricated reading is persisted as if it came " +
            "from a real station. Continuously monitored — rogue device_ids " +
            "can appear at any moment, so the guard re-runs on every ingest.",
        protectionModule: "lib/security/deviceRegistry.ts",
    },
];

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
                        Live attack/defense reproductions. Each card runs a real
                        scripted exploit against this deployment, auto-cleans
                        any rogue artifacts, and logs an alert to the feed.
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {ATTACKS.map((a) => (
                    <AttackCard key={a.id} cfg={a} />
                ))}
            </div>

            <AlertsFeed />

            <FooterLegend />
        </div>
    );
}

function AttackCard({ cfg }: { cfg: AttackCardConfig }) {
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<AttackResult | null>(null);
    const [errorText, setErrorText] = useState<string | null>(null);

    async function runAttack() {
        setBusy(true);
        setErrorText(null);
        try {
            const user = auth.currentUser;
            if (!user) {
                setErrorText("Not signed in. Refresh and log in as admin.");
                return;
            }
            const idToken = await user.getIdToken();
            const res = await fetch(`/api/security/run-attack/${cfg.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
            });
            if (!res.ok) {
                const txt = await res.text();
                setErrorText(`Runner returned ${res.status}: ${txt}`);
                return;
            }
            const data: AttackResult = await res.json();
            setResult(data);
        } catch (e) {
            setErrorText(e instanceof Error ? e.message : "Unknown failure");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <SeverityBadge severity={cfg.severity} />
                    <div>
                        <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                            #{cfg.id} — {cfg.title}
                        </h2>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                            {cfg.column}
                        </p>
                    </div>
                </div>
                <button
                    onClick={runAttack}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {busy ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Running
                        </>
                    ) : (
                        <>
                            <PlayCircle size={14} />
                            Run Attack
                        </>
                    )}
                </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {cfg.overview}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                <Lock size={11} />
                <span className="font-mono">{cfg.protectionModule}</span>
            </div>

            {errorText && (
                <div className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{errorText}</span>
                </div>
            )}

            {result && <ResultPanel result={result} />}
        </div>
    );
}

function ResultPanel({ result }: { result: AttackResult }) {
    const tone =
        result.classification === "exploited"
            ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300"
            : result.classification === "blocked"
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300";
    const Icon =
        result.classification === "exploited"
            ? Bug
            : result.classification === "blocked"
                ? ShieldCheck
                : AlertTriangle;
    const label =
        result.classification === "exploited"
            ? "VULNERABILITY EXPLOITED"
            : result.classification === "blocked"
                ? "ATTACK BLOCKED"
                : "RUNTIME ERROR";

    return (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className={`px-4 py-2.5 flex items-center justify-between border-b ${tone}`}>
                <div className="flex items-center gap-2">
                    <Icon size={15} />
                    <span className="text-xs font-bold tracking-wider uppercase">{label}</span>
                </div>
                <span className="text-[10px] font-mono opacity-70">{result.durationMs} ms</span>
            </div>
            <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 text-[11px] font-mono p-4 space-y-3">
                <div>
                    <span className="text-slate-500">→</span>{" "}
                    <span className="text-amber-300">{result.method}</span>{" "}
                    <span className="text-slate-200">{result.target}</span>
                </div>
                {result.requestBody !== undefined && (
                    <div>
                        <div className="text-slate-500 mb-1">request body:</div>
                        <pre className="whitespace-pre-wrap break-all text-slate-300">
                            {JSON.stringify(result.requestBody, null, 2)}
                        </pre>
                    </div>
                )}
                <div>
                    <span className="text-slate-500">←</span> HTTP{" "}
                    <span className={result.httpStatus >= 200 && result.httpStatus < 300 ? "text-emerald-400" : "text-rose-400"}>
                        {result.httpStatus}
                    </span>
                </div>
                <div>
                    <div className="text-slate-500 mb-1">response body:</div>
                    <pre className="whitespace-pre-wrap break-all text-slate-300">
                        {typeof result.responseBody === "string"
                            ? result.responseBody
                            : JSON.stringify(result.responseBody, null, 2)}
                    </pre>
                </div>
                <div className="border-t border-slate-700 pt-3 text-slate-300">{result.summary}</div>
                {result.cleanup && (
                    <div
                        className={`border-t border-slate-700 pt-3 flex items-start gap-2 ${
                            result.cleanup.performed ? "text-emerald-300" : "text-amber-300"
                        }`}
                    >
                        {result.cleanup.performed ? <Trash2 size={12} className="mt-0.5" /> : <AlertTriangle size={12} className="mt-0.5" />}
                        <span>{result.cleanup.message}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function SentinelStatus() {
    const { report, error, busy } = useSecuritySentinel(30_000);

    const lastDeletions = report?.deleted ?? [];
    const rogueNodes = report?.rogueNodeAttempts ?? [];
    const jamming = report?.jammingSuspects ?? [];
    const anyActivity = lastDeletions.length > 0 || rogueNodes.length > 0 || jamming.length > 0;
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
                        <strong>{rogueNodes.length}</strong> rogue LoRa attempts (last{" "}
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

                    {!anyActivity && <p className="opacity-80">No rogue activity detected.</p>}
                </div>
            )}
        </div>
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
                        No events yet. Click <em>Run Attack</em> above to generate one.
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

function SeverityBadge({ severity }: { severity: Severity }) {
    const map = {
        critical: "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60",
        high: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
        medium: "bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900/60",
    } as const;
    return (
        <span className={`inline-flex items-center text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md border ${map[severity]}`}>
            {severity}
        </span>
    );
}

function FooterLegend() {
    return (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <p>
                <strong>How to read this:</strong> click <em>Run Attack</em>. The
                page makes a real HTTP request to the targeted endpoint and shows
                the exact response. <span className="text-rose-500 font-semibold">VULNERABILITY EXPLOITED</span> means the
                attack succeeded; <span className="text-emerald-600 font-semibold">ATTACK BLOCKED</span> means the protection
                module caught it. Successful exploits are <strong>auto-cleaned</strong> and
                logged to the alerts feed below. Toggle a protection on/off in
                code, then re-run here to capture before/after screenshots.
            </p>
        </div>
    );
}
