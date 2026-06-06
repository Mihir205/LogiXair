"use client";

import DashboardLayout from "../components/DashboardLayout";
import {
  Activity,
  AlertTriangle,
  Radio,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";

export default function AdminPage() {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50">
        
        {/* CLASSIC B2B HEADER BLOCK */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Admin Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Central infrastructure orchestration and system hardware oversight management.
            </p>
          </div>

          <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span className="text-xs font-semibold tracking-wide text-slate-700">Root Infrastructure Access</span>
          </div>
        </div>

        {/* METRICS BENTO GRID PANEL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Stations"
            value="24"
            trend="+2 added today"
            trendType="positive"
            icon={<Radio size={16} className="text-slate-600" />}
          />
          <MetricCard
            title="Online Nodes"
            value="21"
            trend="Stable network"
            trendType="neutral"
            icon={<Activity size={16} className="text-slate-600" />}
          />
          <MetricCard
            title="Critical Alerts"
            value="3"
            trend="Needs attention"
            trendType="negative"
            icon={<AlertTriangle size={16} className="text-amber-500" />}
          />
          <MetricCard
            title="System Health"
            value="98%"
            trend="Operational performance"
            trendType="positive"
            icon={<ShieldCheck size={16} className="text-slate-600" />}
          />
        </div>

        {/* LOWER SPLIT STRUCTURAL BENTO LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* STATION NETWORK SUMMARY MODULE */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-900">
                  Network Hardware Index
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Live status records of field nodes.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                24 Active
              </span>
            </div>

            <div className="space-y-2 flex-1">
              <StationRow 
                name="ESP32 Weather Station" 
                location="Campus Test Site" 
                status="ONLINE" 
                isOnline={true} 
              />
              <StationRow 
                name="Solar Node Alpha" 
                location="Research Block" 
                status="OFFLINE" 
                isOnline={false} 
              />
            </div>
          </div>

          {/* CRITICAL ALERTS STREAM MODULE */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm flex flex-col">
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold tracking-tight text-slate-900">
                Infrastructure Activity Feed
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time system log alerts.</p>
            </div>

            <div className="space-y-2 flex-1">
              <LogAlertRow 
                title="Communication failure detected" 
                metadata="ESP32 Station • 5 mins ago" 
                type="critical" 
              />
              <LogAlertRow 
                title="Battery below threshold" 
                metadata="Solar Node Alpha • 20 mins ago" 
                type="warning" 
              />
              <LogAlertRow 
                title="Firmware update completed" 
                metadata="Wind Unit • 1 hour ago" 
                type="info" 
              />
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

/* ---------- Simplified B2B Sub-components ---------- */

function MetricCard({ title, value, trend, trendType, icon }: any) {
  const trendColors: any = {
    positive: "text-emerald-600 bg-emerald-50 border-emerald-100/60",
    negative: "text-rose-600 bg-rose-50 border-rose-100/60",
    neutral: "text-slate-600 bg-slate-50 border-slate-200/60",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-300 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          {title}
        </p>
        <div className="p-1.5 bg-slate-50 rounded-md border border-slate-200/40">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2 flex-wrap">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </h3>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${trendColors[trendType] || trendColors.neutral}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

function StationRow({ name, location, status, isOnline }: any) {
  return (
    <div className="bg-slate-50/40 hover:bg-slate-50 rounded-lg p-4 flex justify-between items-center border border-slate-100 transition-colors duration-150">
      <div className="space-y-0.5">
        <h4 className="text-sm font-semibold text-slate-800">{name}</h4>
        <p className="text-xs text-slate-400 font-medium">{location}</p>
      </div>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide border ${
        isOnline 
          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
          : "bg-rose-50 text-rose-700 border-rose-100"
      }`}>
        <span className={`w-1 h-1 rounded-full ${isOnline ? "bg-emerald-500" : "bg-rose-500"}`} />
        {status}
      </span>
    </div>
  );
}

function LogAlertRow({ title, metadata, type }: any) {
  const styles: any = {
    critical: {
      border: "border-l-rose-500 bg-rose-50/20",
      icon: <XCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />,
    },
    warning: {
      border: "border-l-amber-500 bg-amber-50/20",
      icon: <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />,
    },
    info: {
      border: "border-l-indigo-500 bg-indigo-50/20",
      icon: <Info size={14} className="text-indigo-600 shrink-0 mt-0.5" />,
    },
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div className={`border border-slate-100 border-l-4 rounded-lg p-3.5 flex items-start gap-3 transition-colors duration-150 hover:bg-slate-50/30 ${currentStyle.border}`}>
      {currentStyle.icon}
      <div className="space-y-0.5">
        <h4 className="text-xs font-semibold text-slate-800 leading-normal">{title}</h4>
        <p className="text-[10px] text-slate-400 font-medium tracking-normal">{metadata}</p>
      </div>
    </div>
  );
}