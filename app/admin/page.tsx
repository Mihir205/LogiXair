"use client";
import DashboardLayout from "../components/DashboardLayout";
import RouteGuard from "../components/RouteGuard";
import AuthGuard from "../components/AuthGuard";
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
    <AuthGuard>
      <RouteGuard allowedRole="admin">
        <DashboardLayout role="admin">
          <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-600/10 selection:text-indigo-700 transition-colors duration-200">
            
            {/* CLASSIC B2B HEADER BLOCK */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  Central infrastructure orchestration and system hardware oversight management.
                </p>
              </div>

              <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200">
                <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Root Infrastructure Access</span>
              </div>
            </div>

            {/* METRICS BENTO GRID PANEL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Stations"
                value="24"
                trend="+2 added today"
                trendType="positive"
                icon={<Radio size={16} className="text-slate-600 dark:text-slate-400" />}
              />
              <MetricCard
                title="Online Nodes"
                value="21"
                trend="Stable network"
                trendType="neutral"
                icon={<Activity size={16} className="text-slate-600 dark:text-slate-400" />}
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
                icon={<ShieldCheck size={16} className="text-slate-600 dark:text-slate-400" />}
              />
            </div>

            {/* LOWER SPLIT STRUCTURAL BENTO LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* STATION NETWORK SUMMARY MODULE */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-sm flex flex-col transition-colors duration-200">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                      Network Hardware Index
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Live status records of field nodes.</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 transition-colors duration-200 shadow-sm">
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
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-sm flex flex-col transition-colors duration-200">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    Infrastructure Activity Feed
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time system log alerts.</p>
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
      </RouteGuard>
    </AuthGuard>
  );
}

/* ---------- Simplified B2B Sub-components with Theme Adapters ---------- */

function MetricCard({ title, value, trend, trendType, icon }: any) {
  const trendColors: any = {
    positive: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100/60 dark:border-emerald-900/40",
    negative: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-100/60 dark:border-rose-900/40",
    neutral: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60",
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          {title}
        </p>
        <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200/40 dark:border-slate-700/60 transition-colors duration-200 shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2 flex-wrap">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
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
    <div className="bg-slate-50/40 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg p-4 flex justify-between items-center border border-slate-100 dark:border-slate-800/40 transition-colors duration-150">
      <div className="space-y-0.5">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{name}</h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{location}</p>
      </div>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide border transition-colors duration-200 ${
        isOnline 
          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40" 
          : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/40"
      }`}>
        <span className={`w-1 h-1 rounded-full ${isOnline ? "bg-emerald-500 dark:bg-emerald-400" : "bg-rose-500 dark:bg-rose-400"}`} />
        {status}
      </span>
    </div>
  );
}

function LogAlertRow({ title, metadata, type }: any) {
  const styles: any = {
    critical: {
      border: "border-l-rose-500 bg-rose-50/20 dark:bg-rose-950/10",
      icon: <XCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />,
    },
    warning: {
      border: "border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10",
      icon: <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />,
    },
    info: {
      border: "border-l-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10",
      icon: <Info size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />,
    },
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div className={`border border-slate-100 dark:border-slate-800 border-l-4 rounded-lg p-3.5 flex items-start gap-3 transition-colors duration-150 hover:bg-slate-50/30 dark:hover:bg-slate-800/40 ${currentStyle.border}`}>
      {currentStyle.icon}
      <div className="space-y-0.5">
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal">{title}</h4>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-normal">{metadata}</p>
      </div>
    </div>
  );
}