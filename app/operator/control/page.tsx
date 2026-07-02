"use client";

import { useState } from "react";
import RouteGuard from "../../components/RouteGuard";
import AuthGuard from "../../components/AuthGuard";
import DashboardLayout from "../../components/DashboardLayout";
import useDeviceHealth from "../../../lib/useDeviceHealth";
import { auth } from "../../../lib/firebase";
import { Settings, RefreshCw, SlidersHorizontal, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function ControlPage() {
  const health = useDeviceHealth();
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const send = async (command: "restart" | "sync", label: string) => {
    setBusy(command);
    setFeedback(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not signed in");
      const token = await user.getIdToken();
      const res = await fetch("/api/station-command", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed");
      setFeedback({ ok: true, msg: `${label} request queued for the field gateway.` });
    } catch (e: any) {
      setFeedback({ ok: false, msg: e?.message ?? "Command failed" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <AuthGuard>
      <RouteGuard allowedRole="operator">
        <DashboardLayout role="operator">
          <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Station Control</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  Queue commands for the field gateway. Requests are logged with operator and timestamp.
                </p>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm ${
                health?.online ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/60" : "bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/60"
              }`}>
                <Settings size={14} className={health?.online ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"} />
                <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                  {health == null ? "Awaiting telemetry…" : health.online ? "Node Reachable" : "Node Offline"}
                </span>
              </div>
            </div>

            {/* LIVE STATUS STRIP */}
            {health && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatChip label="Station" value={health.stationId} />
                <StatChip label="Battery" value={health.battery.label} tone={health.battery.level} />
                <StatChip label="Signal" value={health.signal.label} tone={health.signal.level} />
                <StatChip label="Last packet" value={health.lastSeenSec != null ? (health.lastSeenSec < 60 ? `${health.lastSeenSec}s` : `${Math.floor(health.lastSeenSec / 60)}m`) : "—"} tone={health.online ? "good" : "bad"} />
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Command Console</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Commands are queued and delivered when the gateway command channel is online.
                  </p>
                </div>
                <SlidersHorizontal size={15} className="text-slate-400 dark:text-slate-500" />
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => send("restart", "Restart station")}
                  disabled={busy !== null}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 dark:bg-emerald-700 text-white font-semibold text-xs tracking-wide uppercase px-5 py-3 rounded-lg border border-emerald-700 dark:border-emerald-800 shadow-sm transition-all hover:bg-emerald-500 dark:hover:bg-emerald-600 disabled:opacity-60 cursor-pointer active:scale-[0.98]"
                >
                  {busy === "restart" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  Queue Restart
                </button>
                <button
                  onClick={() => send("sync", "Data sync")}
                  disabled={busy !== null}
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-700 text-white font-semibold text-xs tracking-wide uppercase px-5 py-3 rounded-lg border border-indigo-700 dark:border-indigo-800 shadow-sm transition-all hover:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-60 cursor-pointer active:scale-[0.98]"
                >
                  {busy === "sync" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  Request Data Sync
                </button>
              </div>

              {feedback && (
                <div className={`mt-5 inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border ${
                  feedback.ok ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40"
                              : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/40"
                }`}>
                  {feedback.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                  {feedback.msg}
                </div>
              )}
            </div>
          </div>
        </DashboardLayout>
      </RouteGuard>
    </AuthGuard>
  );
}

function StatChip({ label, value, tone = "unknown" }: { label: string; value: string; tone?: string }) {
  const t: Record<string, string> = {
    good: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    bad: "text-rose-600 dark:text-rose-400",
    unknown: "text-slate-700 dark:text-slate-300",
  };
  return (
    <div className="rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-sm font-bold mt-0.5 truncate ${t[tone]}`}>{value}</p>
    </div>
  );
}
