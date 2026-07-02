"use client";

import RouteGuard from "../../components/RouteGuard";
import AuthGuard from "../../components/AuthGuard";
import DashboardLayout from "../../components/DashboardLayout";
import useDeviceHealth from "../../../lib/useDeviceHealth";
import { Wrench, CheckCircle2, AlertTriangle, Battery, Wifi, Radio, Sun } from "lucide-react";

type Item = { label: string; target: string; status: "ok" | "attention" | "due"; note: string };

export default function MaintenancePage() {
  const health = useDeviceHealth();

  const items: Item[] = health
    ? [
        {
          label: "Battery Health",
          target: "Solar node power cell",
          status: health.battery.level === "good" ? "ok" : health.battery.level === "bad" ? "due" : "attention",
          note: health.battery.level === "good" ? "Charge nominal — no action" : health.battery.level === "bad" ? "LOW — schedule replacement" : "Battery status unknown",
        },
        {
          label: "Radio / Antenna",
          target: `Link signal ${health.signal.dbm ?? "—"} dBm`,
          status: health.signal.level === "good" ? "ok" : health.signal.level === "warn" ? "attention" : "due",
          note: health.signal.level === "good" ? "Signal strong — no action" : "Weak signal — check antenna / reposition",
        },
        {
          label: "Connectivity",
          target: health.online ? "Telemetry flowing" : "No recent telemetry",
          status: health.online ? "ok" : "due",
          note: health.online ? "Node reporting on schedule" : "Check station power / gateway / broker",
        },
        {
          label: "Solar Charging",
          target: health.solar.label,
          status: health.solar.level === "good" ? "ok" : health.solar.level === "warn" ? "attention" : "attention",
          note: health.solar.level === "good" ? "Panel delivering current" : "No charge — verify panel (may be night/shade)",
        },
      ]
    : [];

  const dueCount = items.filter((i) => i.status !== "ok").length;

  return (
    <AuthGuard>
      <RouteGuard allowedRole="operator">
        <DashboardLayout role="operator">
          <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Maintenance</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  Live service status derived from station telemetry.
                </p>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm ${
                dueCount === 0 ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/60" : "bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/60"
              }`}>
                <Wrench size={14} className={dueCount === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"} />
                <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                  {health == null ? "Awaiting telemetry…" : dueCount === 0 ? "All systems serviced" : `${dueCount} item${dueCount > 1 ? "s" : ""} need attention`}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-2.5">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Current Service Status</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Recomputed live from the latest packet.</p>
              </div>

              {health == null ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">Waiting for the first telemetry packet…</p>
              ) : (
                items.map((it) => <StatusRow key={it.label} item={it} />)
              )}
            </div>
          </div>
        </DashboardLayout>
      </RouteGuard>
    </AuthGuard>
  );
}

function StatusRow({ item }: { item: Item }) {
  const icons: Record<string, any> = {
    "Battery Health": <Battery size={15} />,
    "Radio / Antenna": <Wifi size={15} />,
    "Connectivity": <Radio size={15} />,
    "Solar Charging": <Sun size={15} />,
  };
  const style =
    item.status === "ok"
      ? { badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40", icon: <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />, text: "OK" }
      : item.status === "attention"
        ? { badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40", icon: <AlertTriangle size={15} className="text-amber-500 shrink-0" />, text: "Attention" }
        : { badge: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/40", icon: <AlertTriangle size={15} className="text-rose-500 shrink-0" />, text: "Service due" };

  return (
    <div className="bg-slate-50/40 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3">
        {style.icon}
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
            <span className="text-slate-400">{icons[item.label]}</span>{item.label}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{item.target} — {item.note}</p>
        </div>
      </div>
      <span className={`text-[11px] font-bold px-2.5 py-1 rounded border tracking-wide self-start sm:self-auto ${style.badge}`}>
        {style.text}
      </span>
    </div>
  );
}
