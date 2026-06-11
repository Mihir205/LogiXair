"use client";

import useAlerts from "../../../lib/useAlerts";
import DashboardLayout from "../../components/DashboardLayout";
import useUserRole from "../../../lib/useUserRole";
import AuthGuard from "../../components/AuthGuard";
import RouteGuard from "../../components/RouteGuard";
import {
  Bell,
  XCircle,
  AlertTriangle,
  Info,
  Clock
} from "lucide-react";

export default function AlertsPage() {
  const { role, loading } = useUserRole();
  const alerts = useAlerts();

  // Pure list logic mappings - 100% intact
  const activeAlerts = alerts
    ? Object.entries(alerts).filter(
      ([_, alert]: any) => alert.status
    )
    : [];

  const activeCount = activeAlerts.length;

  if (loading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium tracking-wide">Loading Operational Matrix...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
    <RouteGuard allowedRole={role}>
    <DashboardLayout role={role}>
      <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">

        {/* CLASSIC B2B HEADER BLOCK */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Live Alerts Feed
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Real-time hardware status anomalies, threshold tracking, and communication diagnostic streams.
            </p>
          </div>

          <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200">
            <Bell size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
              {activeCount} Active Alerts
            </span>
          </div>
        </div>

        {/* ALERTS SYSTEM MATRIX CONTAINER */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-3 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-800">

          {/* Section Sub-header Meta */}
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Active Incidents & Logs
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tracking-tight">Requires operational oversight and node physical validation.</p>
          </div>

          {activeAlerts.length > 0 ? (
            activeAlerts.map(([key, alert]: any) => (
              <AlertRow
                key={key}
                title={alert.message}
                node={`Current Value: ${alert.value}`}
                time={new Date(alert.timestamp).toLocaleTimeString()}
                type={
                  key === "heavy_rain"
                    ? "critical"
                    : key === "high_temperature" || key === "low_temperature"
                      ? "warning"
                      : "info"
                }
              />
            ))
          ) : (
            /* NOMINAL NOMINAL NOMINAL OPERATIONAL STATE INDICATOR */
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 mb-4 shadow-sm animate-pulse">
                <Bell size={22} className="text-emerald-600 dark:text-emerald-400" />
              </div>

              <h3 className="text-base font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">
                No Active Alerts Detected
              </h3>

              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto font-medium">
                All physical remote field deployment stations are transmitting telemetries within baseline thresholds.
              </p>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
    </RouteGuard>
    </AuthGuard>
  );
}

/* ---------- Simplified B2B Sub-components ---------- */

function AlertRow({ title, node, time, type }: { title: string; node: string; time: string; type: "critical" | "warning" | "info" }) {
  // Mapping clinical desaturated style configs across standard darkness variations
  const styles: any = {
    critical: {
      border: "border-l-rose-500 bg-rose-50/10 dark:bg-rose-950/10 hover:bg-rose-50/20 dark:hover:bg-rose-950/20",
      icon: <XCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />,
      badge: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/60"
    },
    warning: {
      border: "border-l-amber-500 bg-amber-50/10 dark:bg-amber-950/10 hover:bg-amber-50/20 dark:hover:bg-amber-950/20",
      icon: <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />,
      badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/60"
    },
    info: {
      border: "border-l-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20",
      icon: <Info size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />,
      badge: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/60"
    }
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div className={`border border-slate-200/60 dark:border-slate-800/60 border-l-4 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-150 ${currentStyle.border}`}>
      <div className="flex items-start gap-3.5">
        <div className="p-1 bg-white dark:bg-slate-800 rounded-md border border-slate-200/40 dark:border-slate-700/40 shadow-sm shrink-0">
          {currentStyle.icon}
        </div>
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight leading-normal">
            {title}
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-normal">
            {node}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60">
          <Clock size={11} />
          {time}
        </div>
        <span className={`inline-flex items-center text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border uppercase ${currentStyle.badge}`}>
          {type}
        </span>
      </div>
    </div>
  );
}