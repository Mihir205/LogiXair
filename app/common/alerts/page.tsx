"use client";

import DashboardLayout from "../../components/DashboardLayout";
import useUserRole from "../../../lib/useUserRole";
import { 
  Bell, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Clock 
} from "lucide-react";

export default function AlertsPage() {
  const { role, loading } = useUserRole();
  if (loading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 antialiased selection:bg-indigo-600/10 selection:text-indigo-700">
        
        {/* CLASSIC B2B HEADER BLOCK */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Live Alerts Feed
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Real-time hardware status anomalies, threshold tracking, and communication diagnostic streams.
            </p>
          </div>
          
          <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-sm">
            <Bell size={14} className="text-indigo-600" />
            <span className="text-xs font-semibold tracking-wide text-slate-700">3 Notifications Pending</span>
          </div>
        </div>

        {/* ALERTS SYSTEM MATRIX CONTAINER */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-3 transition-all duration-200 hover:border-slate-300">
          
          {/* Section Sub-header Meta */}
          <div className="pb-3 border-b border-slate-100 mb-4">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
              Active Incidents & Logs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 tracking-tight">Requires operational oversight and node physical validation.</p>
          </div>

          {/* CRITICAL INCIDENT */}
          <AlertRow 
            title="Communication Failure Detected" 
            node="ESP32 Main Field Broadcaster • Node-TX-901"
            time="5 mins ago" 
            type="critical" 
          />

          {/* WARNING INCIDENT */}
          <AlertRow 
            title="Battery Below Threshold" 
            node="Solar Node Alpha • Auxiliary Pack"
            time="20 mins ago" 
            type="warning" 
          />

          {/* INFO INCIDENT */}
          <AlertRow 
            title="Rain Probability Increasing" 
            node="Atmospheric Sensor Array • Virtual Node"
            time="1 hour ago" 
            type="info" 
          />

        </div>
      </div>
    </DashboardLayout>
  );
}

/* ---------- Simplified B2B Sub-components ---------- */

function AlertRow({ title, node, time, type }: { title: string; node: string; time: string; type: "critical" | "warning" | "info" }) {
  // Mapping clinical desaturated style configs
  const styles: any = {
    critical: {
      border: "border-l-rose-500 bg-rose-50/10 hover:bg-rose-50/20",
      icon: <XCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />,
      badge: "bg-rose-50 text-rose-700 border-rose-100"
    },
    warning: {
      border: "border-l-amber-500 bg-amber-50/10 hover:bg-amber-50/20",
      icon: <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />,
      badge: "bg-amber-50 text-amber-700 border-amber-100"
    },
    info: {
      border: "border-l-indigo-500 bg-indigo-50/10 hover:bg-indigo-50/20",
      icon: <Info size={15} className="text-indigo-600 shrink-0 mt-0.5" />,
      badge: "bg-indigo-50 text-indigo-700 border-indigo-100"
    }
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div className={`border border-slate-150 border-l-4 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-150 ${currentStyle.border}`}>
      <div className="flex items-start gap-3.5">
        <div className="p-1 bg-white rounded-md border border-slate-200/40 shadow-sm shrink-0">
          {currentStyle.icon}
        </div>
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-800 tracking-tight leading-normal">
            {title}
          </h4>
          <p className="text-xs text-slate-400 font-medium tracking-normal">
            {node}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-50 border-slate-200/60">
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