"use client";

import DashboardLayout from "../../components/DashboardLayout";
import { Wrench, CheckCircle2, Calendar } from "lucide-react";

export default function MaintenancePage() {
  return (
    <DashboardLayout role="operator">
      <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 antialiased selection:bg-indigo-600/10 selection:text-indigo-700">
        
        {/* CLASSIC B2B HEADER BLOCK */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Maintenance Logs
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Historical timeline of field node engineering actions and sensory calibrations.
            </p>
          </div>
          
          <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-sm">
            <Wrench size={14} className="text-indigo-600" />
            <span className="text-xs font-semibold tracking-wide text-slate-700">Hardware Audit Compliant</span>
          </div>
        </div>

        {/* LOG PANEL BLOCK */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-2.5 transition-all duration-200 hover:border-slate-300">
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h2 className="text-sm font-bold tracking-tight text-slate-900">Completed Operations</h2>
            <p className="text-xs text-slate-500 mt-0.5">Verified structural node interventions.</p>
          </div>

          <LogEntry label="Firmware Updated" target="ESP32 System Array &bull; v2.4.1" time="Automated Pipeline" />
          <LogEntry label="Battery Replaced" target="Solar Node Alpha &bull; Lithium Cell B" time="Manual Field Action" />
          <LogEntry label="Sensor Calibration Done" target="Barometric Core Coupling" time="Diagnostics Scheduled" />
        </div>

      </div>
    </DashboardLayout>
  );
}

function LogEntry({ label, target, time }: { label: string; target: string; time: string }) {
  return (
    <div className="bg-slate-50/40 hover:bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors duration-150">
      <div className="flex items-center gap-3">
        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-slate-800 tracking-tight">{label}</p>
          <p className="text-xs text-slate-400 font-medium">{target}</p>
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold text-slate-400 bg-white border-slate-200/60 self-start sm:self-auto">
        <Calendar size={11} />
        {time}
      </div>
    </div>
  );
}