"use client";

import DashboardLayout from "../../components/DashboardLayout";
import { ShieldAlert, Terminal, Lock, Activity } from "lucide-react";

export default function SecurityPage() {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 antialiased selection:bg-indigo-600/10 selection:text-indigo-700">
        
        {/* CLASSIC B2B HEADER BLOCK */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Security Center
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Audit operational credential authorization metrics and system access vector analytics.
            </p>
          </div>
          
          <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-sm">
            <ShieldAlert size={14} className="text-indigo-600" />
            <span className="text-xs font-semibold tracking-wide text-slate-700">Infrastructure Armored</span>
          </div>
        </div>

        {/* SECURITY AUDIT MODULE CONTAINER */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col transition-all duration-200 hover:border-slate-300">
          <div className="pb-3 border-b border-slate-100 mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900">Live Firewall Metrics</h2>
              <p className="text-xs text-slate-500 mt-0.5">Active validation system analytics logs.</p>
            </div>
            <Terminal size={15} className="text-slate-400" />
          </div>

          <div className="space-y-1.5">
            <SecurityAuditRow 
              metric="Failed Login Attempts : 2" 
              context="Brute-force vector monitor threshold checks."
              metricValue="2" 
              isWarning={true} 
              icon={<ShieldAlert size={14} />} 
            />
            <SecurityAuditRow 
              metric="Active Sessions : 5" 
              context="Simultaneous active credential browser keys."
              metricValue="5 Active" 
              icon={<Activity size={14} />} 
            />
            <SecurityAuditRow 
              metric="Last Security Scan : Today" 
              context="Automated database root injection validation audit."
              metricValue="Today" 
              icon={<Lock size={14} />} 
              isOptimal={true}
            />
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

function SecurityAuditRow({ metric, context, metricValue, isWarning, isOptimal, icon }: any) {
  return (
    <div className="bg-slate-50/40 hover:bg-slate-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-slate-100 transition-colors duration-150">
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2.5 text-slate-700">
          <div className={`p-1 bg-white rounded border ${isWarning ? "text-rose-500 border-rose-100 shadow-sm" : "border-slate-200/40"}`}>
            {icon}
          </div>
          <h4 className="text-sm font-bold text-slate-800 leading-none">{metric}</h4>
        </div>
        <p className="text-xs text-slate-400 font-medium sm:pl-7">{context}</p>
      </div>

      <span className={`text-xs font-bold px-2.5 py-1 rounded border self-start sm:self-auto ${
        isWarning 
          ? "bg-rose-50 text-rose-700 border-rose-100" 
          : isOptimal 
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : "bg-white text-slate-700 border-slate-200/60 shadow-sm"
      }`}>
        {metricValue}
      </span>
    </div>
  );
}