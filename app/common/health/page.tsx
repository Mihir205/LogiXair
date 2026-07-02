"use client";

import DashboardLayout from "../../components/DashboardLayout";
import { Activity, Battery, Wifi, ShieldCheck, Sun, Clock, Cpu } from "lucide-react";
import useUserRole from "../../../lib/useUserRole";
import useDeviceHealth, { HealthLevel } from "../../../lib/useDeviceHealth";
import AuthGuard from "../../components/AuthGuard";
import RouteGuard from "../../components/RouteGuard";

function ago(sec: number | null): string {
  if (sec == null) return "never";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

export default function HealthPage() {
  const { role, loading } = useUserRole();
  const health = useDeviceHealth();

  if (loading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium tracking-wide">Loading Power Diagnostics...</span>
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
              Station Health
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Live power supply analytics, RF signal stability, and node operational states.
            </p>
          </div>
          
          <div className={`inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg border shadow-sm transition-colors duration-200 ${
            health?.online
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/60"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/60"
          }`}>
            <Activity size={14} className={health?.online ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"} />
            <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
              {health == null ? "Awaiting telemetry…" : health.online ? "Node Online" : "Node Offline"}
            </span>
          </div>
        </div>

        {health == null && (
          <div className="rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Waiting for the first telemetry packet from the station…
          </div>
        )}

        {/* METRICS BENTO GRID — live */}
        {health && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <HealthCard
            title="Battery Status"
            value={`Battery : ${health.battery.label}`}
            icon={<Battery size={16} className="text-slate-600 dark:text-slate-400" />}
            statusLabel={health.battery.level === "good" ? "Charge level nominal" : health.battery.level === "bad" ? "Replace / recharge soon" : "Reported by node"}
            level={health.battery.level}
          />
          <HealthCard
            title="Signal Strength"
            value={`Signal : ${health.signal.label}`}
            icon={<Wifi size={16} className="text-slate-600 dark:text-slate-400" />}
            statusLabel={health.signal.dbm != null ? `${health.signal.dbm} dBm` : "No RSSI reported"}
            level={health.signal.level}
          />
          <HealthCard
            title="System Connection"
            value={`Status : ${health.online ? "Online" : "Offline"}`}
            icon={<ShieldCheck size={16} className="text-slate-600 dark:text-slate-400" />}
            statusLabel={health.link.label}
            level={health.link.level}
          />
          <HealthCard
            title="Last Packet"
            value={ago(health.lastSeenSec)}
            icon={<Clock size={16} className="text-slate-600 dark:text-slate-400" />}
            statusLabel={health.online ? "Within freshness window" : "Stale — investigate"}
            level={health.online ? "good" : "bad"}
          />
          <HealthCard
            title="Solar Charging"
            value={health.solar.label}
            icon={<Sun size={16} className="text-slate-600 dark:text-slate-400" />}
            statusLabel={health.solar.level === "good" ? "Panel delivering current" : health.solar.level === "warn" ? "No charge (night/shade)" : "No panel sensor"}
            level={health.solar.level}
          />
          <HealthCard
            title="Station Node"
            value={health.stationId}
            icon={<Cpu size={16} className="text-slate-600 dark:text-slate-400" />}
            statusLabel="Reporting device ID"
            level="good"
          />
        </div>
        )}

      </div>
    </DashboardLayout>
    </RouteGuard>
    </AuthGuard>
  );
}

/* ---------- Simplified B2B Sub-components with Theme Adapters ---------- */

function HealthCard({ title, value, icon, statusLabel, level = "good" }: {
  title: string; value: string; icon: React.ReactNode; statusLabel: string; level?: HealthLevel;
}) {
  const dot: Record<HealthLevel, string> = {
    good: "bg-emerald-500 dark:bg-emerald-400",
    warn: "bg-amber-500 dark:bg-amber-400",
    bad: "bg-rose-500 dark:bg-rose-400",
    unknown: "bg-slate-400 dark:bg-slate-500",
  };
  const text: Record<HealthLevel, string> = {
    good: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    bad: "text-rose-600 dark:text-rose-400",
    unknown: "text-slate-500 dark:text-slate-400",
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm group">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase leading-tight">
          {title}
        </p>
        <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200/40 dark:border-slate-700/60 transition-colors duration-200 shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-5 space-y-1.5">
        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
          {value}
        </h3>
        <p className={`text-[11px] font-semibold tracking-normal flex items-center gap-1 ${text[level]}`}>
          <span className={`w-1 h-1 rounded-full inline-block ${level !== "bad" ? "animate-pulse" : ""} ${dot[level]}`} />
          {statusLabel}
        </p>
      </div>
    </div>
  );
}