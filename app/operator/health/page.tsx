"use client";

import DashboardLayout from "../../components/DashboardLayout";
import { Activity, Battery, Wifi, ShieldCheck } from "lucide-react";

export default function HealthPage() {
  return (
    <DashboardLayout role="operator">
      <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 antialiased selection:bg-indigo-600/10 selection:text-indigo-700">
        
        {/* CLASSIC B2B HEADER BLOCK */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Station Health
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Live power supply analytics, RF signal stability, and node operational states.
            </p>
          </div>
          
          <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-sm">
            <Activity size={14} className="text-indigo-600" />
            <span className="text-xs font-semibold tracking-wide text-slate-700">All Nodes Synchronized</span>
          </div>
        </div>

        {/* METRICS BENTO GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <HealthCard 
            title="Battery Status" 
            value="Battery : 92%" 
            icon={<Battery size={16} className="text-slate-600" />} 
            statusLabel="Charge Level Optimal"
            statusType="positive"
          />
          <HealthCard 
            title="Signal Strength" 
            value="Signal : Strong" 
            icon={<Wifi size={16} className="text-slate-600" />} 
            statusLabel="-45dBm Latency Stable"
            statusType="positive"
          />
          <HealthCard 
            title="System Connection" 
            value="Status : Online" 
            icon={<ShieldCheck size={16} className="text-slate-600" />} 
            statusLabel="Live Primary Link"
            statusType="positive"
          />
        </div>

      </div>
    </DashboardLayout>
  );
}

function HealthCard({ title, value, icon, statusLabel, statusType }: any) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-300 shadow-sm group">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase leading-tight">
          {title}
        </p>
        <div className="p-1.5 bg-slate-50 rounded-md border border-slate-200/40 shrink-0">
          {icon}
        </div>
      </div>
      
      <div className="mt-5 space-y-1.5">
        <h3 className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors duration-150 leading-none">
          {value}
        </h3>
        <p className="text-[11px] font-semibold text-emerald-600 tracking-normal flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block animate-pulse" />
          {statusLabel}
        </p>
      </div>
    </div>
  );
}