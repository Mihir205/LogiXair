"use client";

import DashboardLayout from "../../components/DashboardLayout";
import { Activity, Battery, Wifi, ShieldCheck } from "lucide-react";
import useUserRole from "../../../lib/useUserRole";
import AuthGuard from "../../components/AuthGuard";
import RouteGuard from "../../components/RouteGuard";

export default function HealthPage() {
  const { role, loading } = useUserRole();

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
          
          <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200">
            <Activity size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">All Nodes Synchronized</span>
          </div>
        </div>

        {/* METRICS BENTO GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <HealthCard 
            title="Battery Status" 
            value="Battery : 92%" 
            icon={<Battery size={16} className="text-slate-600 dark:text-slate-400" />} 
            statusLabel="Charge Level Optimal"
            statusType="positive"
          />
          <HealthCard 
            title="Signal Strength" 
            value="Signal : Strong" 
            icon={<Wifi size={16} className="text-slate-600 dark:text-slate-400" />} 
            statusLabel="-45dBm Latency Stable"
            statusType="positive"
          />
          <HealthCard 
            title="System Connection" 
            value="Status : Online" 
            icon={<ShieldCheck size={16} className="text-slate-600 dark:text-slate-400" />} 
            statusLabel="Live Primary Link"
            statusType="positive"
          />
        </div>

      </div>
    </DashboardLayout>
    </RouteGuard>
    </AuthGuard>
  );
}

/* ---------- Simplified B2B Sub-components with Theme Adapters ---------- */

function HealthCard({ title, value, icon, statusLabel, statusType }: any) {
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
        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-150 leading-none">
          {value}
        </h3>
        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-normal flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400 inline-block animate-pulse" />
          {statusLabel}
        </p>
      </div>
    </div>
  );
}