"use client";

import DashboardLayout from "../components/DashboardLayout";
import {
  Activity,
  Radio,
  Thermometer,
  Wind,
  Droplets,
  AlertTriangle,
  Cpu,
  MapPinned,
  Gauge,
  CloudRain,
  Sun,
  XCircle,
  Info,
} from "lucide-react";

export default function OperatorPage() {
  return (
    <DashboardLayout role="operator">
      <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 antialiased selection:bg-indigo-600/10 selection:text-indigo-700">
        
        {/* OPERATOR COMMAND HEADER BLOCK */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Operator Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Live operational monitoring and physical telemetry command interface.
            </p>
          </div>
          
          <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span className="text-xs font-semibold tracking-wide text-slate-700">Root Infrastructure Operations</span>
          </div>
        </div>

        {/* FIELD NODE HERO SUMMARY CARD */}
        <div className="rounded-xl overflow-hidden border border-slate-200/60 bg-white p-8 relative group shadow-sm transition-all duration-200 hover:border-slate-300">
          {/* Subtle Dynamic Status Indicator */}
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500" />
          
          <div className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-100 pointer-events-none hidden md:block">
            <Radio size={120} className="stroke-[1.2]" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                <span className="animate-ping absolute h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                Primary Link Live
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 pt-1">
                ESP32 Weather Station Node
              </h1>
              <p className="text-slate-500 text-sm max-w-xl">
                Deployed Node ID: <span className="font-semibold text-slate-700">ESP32-TX-901</span>. Measuring active physical telemetry and node environmental coupling diagnostics.
              </p>
            </div>
          </div>
        </div>

        {/* METRICS BENTO GRID (Hardware Overview) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Core Temperature"
            value="27°C"
            trend="Station optimal"
            trendType="positive"
            icon={<Thermometer size={16} className="text-slate-600" />}
          />
          <MetricCard
            title="Coupling Humidity"
            value="65%"
            trend="Rel. Humidity"
            trendType="neutral"
            icon={<Droplets size={16} className="text-slate-600" />}
          />
          <MetricCard
            title="Air Velocity"
            value="6 km/h"
            trend="Light airflow"
            trendType="neutral"
            icon={<Wind size={16} className="text-slate-600" />}
          />
          <MetricCard
            title="Active Components"
            value="12"
            trend="Hardware diagnostic"
            trendType="positive"
            icon={<Cpu size={16} className="text-slate-600" />}
          />
        </div>

        {/* LOWER SPLIT BENTO MODULES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* PRIMARY TELEMETRY SENSOR FEED Table */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900">
                    Live Telemetry Core Feed
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">High-frequency sensor diagnostics.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white text-slate-700 border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Telemetry
                </span>
              </div>

              <div className="space-y-1">
                <SensorRow label="Pressure Sensor Node" value="907 hPa" icon={<Gauge size={14} className="text-slate-500" />} />
                <SensorRow label="Rainfall Trigger" value="1 mm" icon={<CloudRain size={14} className="text-slate-500" />} />
                <SensorRow label="Irradiance Sensor" value="1 W/m²" icon={<Sun size={14} className="text-slate-500" />} />
              </div>
            </div>
          </div>

          {/* LOWER RIGHT COMPLEX BENTO WRAPPER */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* LOG ALERTS STREAM */}
            <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900">
                    Operational Field Alerts
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Hardware activity logs.</p>
                </div>
                <AlertTriangle size={15} className="text-amber-500" />
              </div>
              <div className="space-y-2">
                <LogAlertRow title="Communication delay detected" metadata="Node Alpha • 2 mins ago" type="critical" />
                <LogAlertRow title="Battery fluctuation warning" metadata="Solar Unit • 12 mins ago" type="warning" />
              </div>
            </div>

            {/* DEPLOYMENT MAP MODULE */}
            <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <MapPinned size={16} className="text-indigo-600" />
                <h2 className="text-sm font-bold tracking-tight text-slate-900">
                  Node Hardware Deployment Site
                </h2>
              </div>
              <div className="rounded-lg overflow-hidden border border-slate-200/60 h-[280px] bg-slate-50 relative">
                <iframe
                  src="https://maps.google.com/maps?q=hyderabad&t=&z=5&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0 focus:outline-none saturate-[0.8]"
                  loading="lazy"
                  title="Field Operation Map Grid"
                />
              </div>
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
        <div className="p-1.5 bg-slate-50 rounded-md border border-slate-200/40 shrink-0">
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

function SensorRow({ label, value, icon }: any) {
  return (
    <div className="bg-slate-50/40 hover:bg-slate-50 rounded-lg p-4 flex justify-between items-center border border-slate-100 transition-colors duration-150">
      <div className="space-y-0.5 flex items-center gap-3">
        <div className="p-1.5 bg-white rounded-md border border-slate-200/40 shrink-0">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800 leading-none">{label}</h4>
          <p className="text-xs text-slate-400 font-medium tracking-tight">Telemetry Node Broadcast</p>
        </div>
      </div>
      <h1 className="text-xl font-bold tracking-tight text-slate-900 shrink-0">
        {value}
      </h1>
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
    <div className={`border border-slate-100 border-l-4 rounded-lg p-3 flex items-start gap-3 transition-colors duration-150 hover:bg-slate-50/40 ${currentStyle.border}`}>
      {currentStyle.icon}
      <div className="space-y-0.5 flex-1">
        <h4 className="text-[12px] font-semibold text-slate-800 leading-normal">{title}</h4>
        <p className="text-[10px] text-slate-400 font-medium tracking-normal">{metadata}</p>
      </div>
    </div>
  );
}