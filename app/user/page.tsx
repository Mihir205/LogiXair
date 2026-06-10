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
  Mountain,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import useWeatherData from "../../lib/useWeatherData";

export default function UserPage() {
  const weather = useWeatherData();
  const [formattedTime, setFormattedTime] = useState<string>("--");

  // Fix client/server hydration mismatch for local time strings
  useEffect(() => {
    if (weather?.timestamp) {
      setFormattedTime(new Date(weather.timestamp).toLocaleTimeString());
    }
  }, [weather?.timestamp]);

  // Clean, minimal inline loading state
  if (!weather) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl border border-slate-200/60 shadow-sm">
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
          <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50">
            
            {/* CLASSIC B2B HEADER BLOCK */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  User Dashboard
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  Real-time weather telemetry and field station infrastructure monitoring.
                </p>
              </div>
              
              {/* Simple Network Connection Pill */}
              <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold tracking-wide text-slate-700">Station Connected</span>
              </div>
            </div>

            {/* METRICS BENTO GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
              <MetricCard
                title="Temperature"
                value={`${weather.temperature}°C`}
                icon={<Thermometer size={18} className="text-indigo-600" />}
              />
              <MetricCard
                title="Humidity"
                value={`${weather.humidity}%`}
                icon={<Droplets size={18} className="text-indigo-600" />}
              />
              <MetricCard
                title="Pressure"
                value={`${weather.pressure?.toFixed(1)} hPa`}
                icon={<Gauge size={18} className="text-indigo-600" />}
              />
              <MetricCard
                title="Rain"
                value={weather.rain ? "Detected" : "None"}
                icon={<CloudSun size={18} className="text-indigo-600" />}
              />
              <MetricCard
                title="Light Level"
                value={`${weather.light}`}
                icon={<Sun size={18} className="text-indigo-600" />}
              />
              <MetricCard
                title="Irradiance"
                value={`${weather.irradiance}`}
                icon={<Sun size={18} className="text-indigo-600" />}
              />
              <MetricCard
                title="Last Updated"
                value={formattedTime}
                icon={<CheckCircle2 size={18} className="text-indigo-600" />}
              />
            </div>

            {/* LOWER SPLIT GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* HARDWARE DIAGNOSTICS TABLE */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="pb-3 mb-4">
                    <h2 className="text-sm font-bold tracking-tight text-slate-900">
                      Station Hardware Diagnostics
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Physical node status reports.</p>
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
              <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 pb-3 mb-4">
                  <MapPinned size={16} className="text-indigo-600" />
                  <h2 className="text-sm font-bold tracking-tight text-slate-900">
                    Station Deployment Location
                  </h2>
                </div>

                <div className="rounded-lg overflow-hidden border border-slate-200/60 h-[320px] bg-slate-100">
                  <iframe
                    src="https://maps.google.com/maps?q=Hyderabad&t=&z=12&ie=UTF8&iwloc=&output=embed"
                    className="w-full h-full border-0 focus:outline-none saturate-[0.85]"
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
    <div className="bg-white rounded-xl border border-slate-200/60 p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-300 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          {title}
        </p>
        <div className="p-1.5 bg-slate-50 rounded-md border border-slate-200/40">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold tracking-tight text-slate-900 mt-4 whitespace-nowrap">
        {value}
      </h3>
    </div>
  );
}

function DiagnosticRow({ label, status, isNormal }: any) {
  return (
    <div className="bg-slate-50/40 rounded-lg px-4 py-3 flex justify-between items-center border border-slate-100 hover:bg-slate-50 transition-colors duration-150">
      <span className="text-xs font-medium text-slate-600">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {isNormal ? (
          <CheckCircle2 size={13} className="text-emerald-500" />
        ) : (
          <AlertTriangle size={13} className="text-amber-500" />
        )}
        <span className={`text-xs font-bold ${isNormal ? "text-slate-700" : "text-amber-600"}`}>
          {status}
        </span>
      </div>
    </div>
  );
}