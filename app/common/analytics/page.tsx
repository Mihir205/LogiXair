"use client";

import { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import useAnalyticsData from "../../../lib/useAnalyticsData";
import useUserRole from "../../../lib/useUserRole";


import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Activity,
  CloudRain,
  Wind as WindIcon,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";

export default function AnalyticsPage() {
  const analytics = useAnalyticsData();
  const [tab, setTab] = useState("summary");
  const { role, loading } = useUserRole();
  if (loading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Analytics...
      </div>
    );
  }

  // Clean, minimal loading state
  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl border border-slate-200/60 shadow-sm">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium tracking-wide">Retrieving analytics stream...</span>
        </div>
      </div>
    );
  }

  // Pure logic, untouched data mapping
  const hourlyData = Object.entries(analytics.hourly_comparison || {}).map(
    ([hour, value]) => ({
      hour,
      temperature: value,
    })
  );

  const windData = Object.entries(analytics.wind || {}).map(
    ([direction, count]) => ({
      direction,
      count,
    })
  );

  const rainData = [
    {
      name: "Rain",
      value: analytics.rainfall?.rain_events || 0,
    },
    {
      name: "No Rain",
      value: analytics.rainfall?.no_rain_events || 0,
    },
  ];

  // Map tab identifiers to their corresponding icon component
  const tabIcons: any = {
    summary: <Activity size={15} />,
    rain: <CloudRain size={15} />,
    wind: <WindIcon size={15} />,
    anomaly: <AlertTriangle size={15} />,
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50">

        {/* CLASSIC B2B HEADER BLOCK */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Weather Analytics Command
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Time-series data analysis and infrastructure anomaly diagnostics.
            </p>
          </div>

          <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span className="text-xs font-semibold tracking-wide text-slate-700">Analytics Active</span>
          </div>
        </div>

        {/* MODERNIZED TABS INTERFACE */}
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-xl bg-white border border-slate-200/60 shadow-sm">
          {["summary", "rain", "wind", "anomaly"].map((currentTab) => (
            <button
              key={currentTab}
              onClick={() => setTab(currentTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${tab === currentTab
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-transparent text-slate-500 hover:text-slate-800"
                }`}
            >
              {tabIcons[currentTab]}
              <span className="capitalize">{currentTab}</span>
            </button>
          ))}
        </div>

        {/* SUMMARY SECTION */}
        {tab === "summary" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Card
                title="Avg Temp"
                value={`${Number(
                  analytics?.daily_summary?.avg_temperature ?? 0
                ).toFixed(1)}°C`}
              />

              <Card
                title="Max Temp"
                value={`${Number(
                  analytics?.daily_summary?.max_temperature ?? 0
                ).toFixed(1)}°C`}
              />

              <Card
                title="Min Temp"
                value={`${Number(
                  analytics?.daily_summary?.min_temperature ?? 0
                ).toFixed(1)}°C`}
              />

              <Card
                title="Humidity"
                value={`${Number(
                  analytics?.daily_summary?.avg_humidity ?? 0
                ).toFixed(1)}%`}
              />

              <Card
                title="Pressure"
                value={`${Number(
                  analytics?.daily_summary?.avg_pressure ?? 0
                ).toFixed(1)} hPa`}
              />
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm transition-all duration-200 hover:border-slate-300">
              <div className="pb-3 border-b border-slate-100 mb-6">
                <h2 className="text-sm font-bold tracking-tight text-slate-900">
                  Hourly Temperature Trend
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 tracking-tight">Time-series diagnostic analysis.</p>
              </div>

              <div className="rounded-lg h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={{ stroke: '#e2e8f0' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={{ stroke: '#e2e8f0' }} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }} />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, stroke: '#4f46e5', strokeWidth: 1, fill: 'white' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* RAINFALL SECTION */}
        {tab === "rain" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm transition-all duration-200 hover:border-slate-300">
              <div className="pb-3 border-b border-slate-100 mb-6">
                <h2 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
                  Precipitation Distribution
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 tracking-tight">Rain vs No Rain event mapping.</p>
              </div>

              <div className="rounded-lg h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rainData}
                      dataKey="value"
                      outerRadius={120}
                      label={{ fontSize: '11px', fill: '#64748b' }}
                      stroke="none"
                    >
                      <Cell fill="#4f46e5" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <Card title="Rain Events" value={analytics.rainfall.rain_events} />
              <Card title="No Rain Events" value={analytics.rainfall.no_rain_events} />
            </div>
          </div>
        )}

        {/* WIND SECTION */}
        {tab === "wind" && (
          <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm transition-all duration-200 hover:border-slate-300">
            <div className="pb-3 border-b border-slate-100 mb-6">
              <h2 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
                Wind Direction Velocity Mapping
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 tracking-tight">Field station broadcast diagnostics.</p>
            </div>

            <div className="rounded-lg h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={windData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="direction" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={{ stroke: '#e2e8f0' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ANOMALIES SECTION */}
        {tab === "anomaly" && (
          <div className="bg-white rounded-xl border border-slate-200/60 p-8 shadow-sm transition-all duration-200 hover:border-slate-300">
            <div className="pb-4 border-b border-slate-100 mb-8">
              <h2 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
                Node Temperature Anomalies
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 tracking-tight">Active field station threshold monitoring.</p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-baseline gap-3">
                <span className="text-7xl font-bold tracking-tight text-rose-600">
                  {analytics.anomalies.temperature_anomalies}
                </span>
                <span className="text-sm font-medium tracking-wider text-rose-500 uppercase">Anomalous Events</span>
              </div>

              <div className={`p-4 rounded-lg border flex items-center gap-3 transition-colors duration-200 ${analytics.anomalies.temperature_anomalies > 0
                  ? "bg-rose-50 border-rose-100 text-rose-700"
                  : "bg-emerald-50 border-emerald-100 text-emerald-700"
                }`}>
                {analytics.anomalies.temperature_anomalies > 0
                  ? <AlertTriangle size={18} className="shrink-0" />
                  : <ShieldCheck size={18} className="shrink-0" />
                }
                <span className="text-sm font-medium tracking-tight">
                  {analytics.anomalies.temperature_anomalies > 0
                    ? "Action Required: Abnormal Pattern Detected"
                    : "Optimal Performance: No Anomalies Detected"}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

function Card({ title, value }: { title: string; value: string | number; }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-300 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase leading-tight">
          {title}
        </p>
        <div className="p-1.5 bg-slate-50 rounded-md border border-slate-200/40 shrink-0">
          <Activity size={14} className="text-slate-600" />
        </div>
      </div>
      <h3 className="text-2xl font-bold tracking-tight text-slate-900 mt-4 leading-none">
        {value}
      </h3>
    </div>
  );
}