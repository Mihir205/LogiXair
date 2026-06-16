"use client";
import { useEffect, useMemo, useState } from "react";
import RouteGuard from "../../components/RouteGuard";
import AuthGuard from "../../components/AuthGuard";
import DashboardLayout from "../../components/DashboardLayout";
import { ShieldAlert, Terminal, Lock, Activity, Unlock, Radio } from "lucide-react";
import {
  collection,
  onSnapshot,
  query,
  Timestamp,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "../../../lib/firebase";
import { MAX_ATTEMPTS, formatRemaining } from "../../../lib/lockout";

// Row shape from the loginAttempts collection
interface LockoutRow {
  id: string;
  email: string;
  failed_attempts: number;
  attempts_remaining: number;
  is_locked: boolean;
  lock_seconds_remaining: number;
}

function rowFromDoc(id: string, data: any, now: number): LockoutRow {
  const failed = (data?.failed_attempts as number) ?? 0;
  const lockedUntil = data?.locked_until as Timestamp | null;
  const lockSec = lockedUntil
    ? Math.max(0, Math.floor((lockedUntil.toMillis() - now) / 1000))
    : 0;
  return {
    id,
    email: (data?.email as string) ?? id,
    failed_attempts: failed,
    attempts_remaining: Math.max(0, MAX_ATTEMPTS - failed),
    is_locked: lockSec > 0,
    lock_seconds_remaining: lockSec,
  };
}

export default function SecurityPage() {
  const [rawRows, setRawRows] = useState<{ id: string; data: any }[]>([]);
  const [tick, setTick] = useState(Date.now());

  // Live Firestore subscription -> Locked Accounts table
  useEffect(() => {
    const q = query(collection(firestore, "loginAttempts"));
    const unsub = onSnapshot(q, (snap) => {
      setRawRows(snap.docs.map((d) => ({ id: d.id, data: d.data() })));
    });
    const t = setInterval(() => setTick(Date.now()), 1000); // re-tick countdowns
    return () => {
      unsub();
      clearInterval(t);
    };
  }, []);

  const rows = useMemo(
    () =>
      rawRows
        .map(({ id, data }) => rowFromDoc(id, data, tick))
        .filter((r) => r.failed_attempts > 0 || r.is_locked)
        .sort((a, b) =>
          a.is_locked === b.is_locked
            ? b.failed_attempts - a.failed_attempts
            : a.is_locked
            ? -1
            : 1
        ),
    [rawRows, tick]
  );

  const lockedCount = rows.filter((r) => r.is_locked).length;
  const atRiskCount = rows.length - lockedCount;

  const unlock = async (id: string, email: string) => {
    await setDoc(
      doc(firestore, "loginAttempts", id),
      {
        email,
        failed_attempts: 0,
        locked_until: null,
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );
  };

  return (
    <AuthGuard>
      <RouteGuard allowedRole="admin">
        <DashboardLayout role="admin">
          <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Security Center
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  Brute-force lockout monitor and live credential authorization metrics.
                </p>
              </div>
              <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <ShieldAlert size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                  Infrastructure Armored
                </span>
              </div>
            </div>

            {/* LOCKOUT PANEL */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    Login Attempts & Lockouts
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Auto-unlock 15 min after {MAX_ATTEMPTS} failed attempts. Live feed from Firestore.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border bg-rose-50 text-rose-700 border-rose-200">
                    {lockedCount} locked
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border bg-amber-50 text-amber-700 border-amber-200">
                    {atRiskCount} at risk
                  </span>
                </div>
              </div>

              {rows.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">
                  No failed-attempt activity. All accounts healthy.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="text-left py-2 px-3">Email</th>
                        <th className="text-left py-2 px-3">Failed</th>
                        <th className="text-left py-2 px-3">Remaining</th>
                        <th className="text-left py-2 px-3">Status</th>
                        <th className="text-left py-2 px-3">Unlock In</th>
                        <th className="text-right py-2 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-slate-100 dark:border-slate-800/60 last:border-0"
                        >
                          <td className="py-2.5 px-3 font-mono text-xs text-slate-800 dark:text-slate-200">
                            {r.email}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {r.failed_attempts} / {MAX_ATTEMPTS}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <span
                              className={
                                r.attempts_remaining <= 1
                                  ? "text-rose-600 font-bold"
                                  : "text-slate-700 dark:text-slate-300"
                              }
                            >
                              {r.attempts_remaining} left
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {r.is_locked ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                LOCKED
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
                                AT RISK
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {r.is_locked ? (
                              <span className="text-rose-600 font-bold">
                                {formatRemaining(r.lock_seconds_remaining)}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => unlock(r.id, r.email)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                            >
                              <Unlock size={12} /> Unlock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* AUDIT METRICS */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    Live Firewall Metrics
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Active validation system analytics logs.
                  </p>
                </div>
                <Terminal size={15} className="text-slate-400 dark:text-slate-500" />
              </div>

              <div className="space-y-1.5">
                <SecurityAuditRow
                  metric={`Failed Login Attempts (live) : ${rows.reduce((a, r) => a + r.failed_attempts, 0)}`}
                  context="Brute-force vector monitor across all accounts."
                  metricValue={`${rows.reduce((a, r) => a + r.failed_attempts, 0)}`}
                  isWarning={rows.length > 0}
                  icon={<ShieldAlert size={14} />}
                />
                <SecurityAuditRow
                  metric={`Currently Locked Accounts : ${lockedCount}`}
                  context="Accounts auto-locked for 15 min after threshold."
                  metricValue={`${lockedCount} locked`}
                  isWarning={lockedCount > 0}
                  isOptimal={lockedCount === 0}
                  icon={<Lock size={14} />}
                />
                <SecurityAuditRow
                  metric="Lockout Policy"
                  context={`${MAX_ATTEMPTS} bad attempts -> 15 min auto-unlock window.`}
                  metricValue="ACTIVE"
                  isOptimal={true}
                  icon={<Activity size={14} />}
                />
              </div>
            </div>

            {/* ── LoRa Replay Attempts (live) ─────────────────────────── */}
            <LoraReplayPanel />

            {/* ── LoRa Packet-Injection Attempts (live) ───────────────── */}
            <LoraInjectionPanel />

          </div>
        </DashboardLayout>
      </RouteGuard>
    </AuthGuard>
  );
}

interface ReplayRow {
  id: string;
  device_id: string;
  nonce: string | number;
  reason: string;
  detail: string;
  blockedAt: Timestamp | null;
}

function LoraReplayPanel() {
  const [rows, setRows] = useState<ReplayRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(firestore, "loraReplayAttempts"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: ReplayRow[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            device_id: data?.device_id ?? "(unknown)",
            nonce: data?.nonce ?? "—",
            reason: data?.reason ?? "—",
            detail: data?.detail ?? "",
            blockedAt: (data?.blockedAt as Timestamp) ?? null,
          };
        });
        next.sort((a, b) => {
          const ta = a.blockedAt?.toMillis() ?? 0;
          const tb = b.blockedAt?.toMillis() ?? 0;
          return tb - ta;
        });
        setRows(next);
      },
      (err) => setError(err.message),
    );
    return () => unsub();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm">
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-indigo-600 dark:text-indigo-400" />
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              LoRa Replay Attempts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live feed of frames rejected by the anti-replay guard.
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${
            rows.length === 0
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {rows.length} blocked
        </span>
      </div>

      {error && (
        <p className="text-xs text-rose-600">Could not read loraReplayAttempts: {error}</p>
      )}

      {!error && rows.length === 0 && (
        <p className="text-center text-slate-400 text-sm py-6">
          No replay attempts detected. Send a duplicate frame to /api/sensors/ingest to test.
        </p>
      )}

      {!error && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <th className="text-left py-2 px-3">Time</th>
                <th className="text-left py-2 px-3">Device</th>
                <th className="text-left py-2 px-3">Nonce</th>
                <th className="text-left py-2 px-3">Reason</th>
                <th className="text-left py-2 px-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((r) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {r.blockedAt?.toDate?.().toLocaleTimeString() ?? "—"}
                  </td>
                  <td className="py-2 px-3 font-mono text-xs">{r.device_id}</td>
                  <td className="py-2 px-3 font-mono text-xs">{r.nonce}</td>
                  <td className="py-2 px-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      {r.reason}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[11px] text-slate-600 dark:text-slate-400">
                    {r.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface InjectionRow {
  id: string;
  device_id: string;
  reason: string;
  detail: string;
  provided_mic: string | null;
  blockedAt: Timestamp | null;
}

function LoraInjectionPanel() {
  const [rows, setRows] = useState<InjectionRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(firestore, "loraInjectionAttempts"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: InjectionRow[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            device_id: data?.device_id ?? "(unknown)",
            reason: data?.reason ?? "—",
            detail: data?.detail ?? "",
            provided_mic: (data?.provided_mic as string | null) ?? null,
            blockedAt: (data?.blockedAt as Timestamp) ?? null,
          };
        });
        next.sort((a, b) => (b.blockedAt?.toMillis() ?? 0) - (a.blockedAt?.toMillis() ?? 0));
        setRows(next);
      },
      (err) => setError(err.message),
    );
    return () => unsub();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm">
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-indigo-600 dark:text-indigo-400" />
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              LoRa Packet-Injection Attempts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Frames rejected because their HMAC-SHA256 MIC did not match the device PSK.
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${
            rows.length === 0
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {rows.length} blocked
        </span>
      </div>

      {error && <p className="text-xs text-rose-600">Could not read loraInjectionAttempts: {error}</p>}

      {!error && rows.length === 0 && (
        <p className="text-center text-slate-400 text-sm py-6">
          No injection attempts detected. Send a frame with a wrong/missing X-LoRa-MIC to test.
        </p>
      )}

      {!error && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <th className="text-left py-2 px-3">Time</th>
                <th className="text-left py-2 px-3">Device</th>
                <th className="text-left py-2 px-3">Reason</th>
                <th className="text-left py-2 px-3">Provided MIC</th>
                <th className="text-left py-2 px-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((r) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {r.blockedAt?.toDate?.().toLocaleTimeString() ?? "—"}
                  </td>
                  <td className="py-2 px-3 font-mono text-xs">{r.device_id}</td>
                  <td className="py-2 px-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      {r.reason}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                    {r.provided_mic ? `${r.provided_mic.slice(0, 14)}…` : "(none)"}
                  </td>
                  <td className="py-2 px-3 text-[11px] text-slate-600 dark:text-slate-400">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SecurityAuditRow({ metric, context, metricValue, isWarning, isOptimal, icon }: any) {
  return (
    <div className="bg-slate-50/40 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-slate-100 dark:border-slate-800/40 transition-colors duration-150">
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
          <div className={`p-1 bg-white dark:bg-slate-800 rounded border transition-colors duration-200 ${
            isWarning
              ? "text-rose-500 border-rose-100 dark:border-rose-900/60 shadow-sm"
              : "border-slate-200/40 dark:border-slate-700/60"
          }`}>
            {icon}
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">{metric}</h4>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium sm:pl-7">{context}</p>
      </div>

      <span className={`text-xs font-bold px-2.5 py-1 rounded border self-start sm:self-auto transition-colors duration-200 ${
        isWarning
          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/40"
          : isOptimal
          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40"
          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 shadow-sm"
      }`}>
        {metricValue}
      </span>
    </div>
  );
}
