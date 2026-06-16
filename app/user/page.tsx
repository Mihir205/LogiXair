"use client";

import { useState, useEffect } from "react";
import RouteGuard from "../components/RouteGuard";
import AuthGuard from "../components/AuthGuard";
import DashboardLayout from "../components/DashboardLayout";
import {
  CloudSun,
  Droplets,
  Thermometer,
  MapPinned,
  Gauge,
  Sun,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import useWeatherData from "../../lib/useWeatherData";

export default function UserPage() {
  const weather = useWeatherData();
  const [formattedDate, setFormattedDate] = useState("--");
  const [formattedTime, setFormattedTime] = useState("--");

  useEffect(() => {
    if (weather?.timestamp) {
      const date = new Date(weather.timestamp);

      setFormattedDate(
        date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );

      setFormattedTime(
        date.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
  }, [weather?.timestamp]);

  // Clean, minimal inline loading state supporting theme colors
  if (!weather) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium tracking-wide">Syncing data streams...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <RouteGuard allowedRole="user">
        <DashboardLayout role="user">
          <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-200">

            {/* CLASSIC B2B HEADER BLOCK */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  User Dashboard
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  Real-time weather telemetry and field station infrastructure monitoring.
                </p>
              </div>

              {/* Simple Network Connection Pill */}
              <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Station Connected</span>
              </div>
            </div>

            {/* METRICS BENTO GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
              <MetricCard
                title="Temperature"
                value={`${weather.temperature}°C`}
                icon={<Thermometer size={18} className="text-indigo-600 dark:text-indigo-400" />}
              />
              <MetricCard
                title="Humidity"
                value={`${weather.humidity}%`}
                icon={<Droplets size={18} className="text-indigo-600 dark:text-indigo-400" />}
              />
              <MetricCard
                title="Pressure"
                value={`${weather.pressure?.toFixed(1)} hPa`}
                icon={<Gauge size={18} className="text-indigo-600 dark:text-indigo-400" />}
              />
              <MetricCard
                title="Rain"
                value={weather.rain ? "Detected" : "None"}
                icon={<CloudSun size={18} className="text-indigo-600 dark:text-indigo-400" />}
              />
              <MetricCard
                title="Light Level"
                value={`${weather.light}`}
                icon={<Sun size={18} className="text-indigo-600 dark:text-indigo-400" />}
              />
              <MetricCard
                title="Irradiance"
                value={`${weather.irradiance}`}
                icon={<Sun size={18} className="text-indigo-600 dark:text-indigo-400" />}
              />
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                    Last Updated
                  </p>

                  <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200/40 dark:border-slate-700/60">
                    <CheckCircle2
                      size={18}
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {formattedTime}
                  </p>

                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">
                    {formattedDate}
                  </p>
                </div>
              </div>
            </div>

            {/* LOWER SPLIT GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* HARDWARE DIAGNOSTICS TABLE */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-sm flex flex-col justify-between transition-colors duration-200">
                <div>
                  <div className="pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                      Station Hardware Diagnostics
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Physical node status reports.</p>
                  </div>

                  <div className="space-y-1">
                    <DiagnosticRow label="Core Microcontroller" status="Optimal" isNormal={true} />
                    <DiagnosticRow label="Barometric Sensor Array" status="Optimal" isNormal={true} />
                    <DiagnosticRow label="Thermal Core Coupling" status="Optimal" isNormal={true} />
                    <DiagnosticRow label="Photoresistor Diode" status="Optimal" isNormal={true} />
                    <DiagnosticRow label="Precipitation Switch" status="Optimal" isNormal={true} />
                    <DiagnosticRow label="Backup Battery Cell" status="94% Capacity" isNormal={true} />
                  </div>
                </div>
              </div>

              {/* GEOGRAPHIC MAP FRAME */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-sm flex flex-col transition-colors duration-200">
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <MapPinned size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    Station Deployment Location
                  </h2>
                </div>

                <div className="rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-800 h-[320px] bg-slate-100 dark:bg-slate-950 transition-colors duration-200">
                  <iframe
                    src="https://maps.google.com/maps?q=Hyderabad&t=&z=12&ie=UTF8&iwloc=&output=embed"
                    className="w-full h-full border-0 focus:outline-none saturate-[0.85] dark:invert dark:hue-rotate-180 dark:opacity-80"
                    loading="lazy"
                    title="Field Deploy Map Layout"
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

/* ---------- Simplified B2B Sub-components ---------- */

function MetricCard({ title, value, icon }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm group">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          {title}
        </p>
        <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200/40 dark:border-slate-700/60 transition-colors duration-200">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-4 whitespace-nowrap">
        {value}
      </h3>
    </div>
  );
}

// Fixed DiagnosticRow targeting specific deep border structures smoothly
function DiagnosticRow({ label, status, isNormal }: any) {
  return (
    <div className="bg-slate-50/40 dark:bg-slate-950/40 rounded-lg px-4 py-3 flex justify-between items-center border border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-150">
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {isNormal ? (
          <CheckCircle2 size={13} className="text-emerald-500" />
        ) : (
          <AlertTriangle size={13} className="text-amber-500" />
        )}
        <span className={`text-xs font-bold ${isNormal ? "text-slate-700 dark:text-slate-200" : "text-amber-600"}`}>
          {status}
        </span>
      </div>
    </div>
  );
}