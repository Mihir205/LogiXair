"use client";

import useAnalyticsData from "../../../lib/useAnalyticsData";
import useLiveReadings from "../../../lib/useLiveReadings";
import useHourlyTrend from "../../../lib/useHourlyTrend";
import useAnomalies from "../../../lib/useAnomalies";
import useWeatherData from "../../../lib/useWeatherData";
import DashboardLayout from "../../components/DashboardLayout";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import AuthGuard from "../../components/AuthGuard";
import RouteGuard from "../../components/RouteGuard";
import useUserRole from "../../../lib/useUserRole";

const TREND_PARAMS = [
  { key: "temperature",    label: "Temperature",    unit: "°C",   color: "#4f46e5" },
  { key: "humidity",       label: "Humidity",       unit: "%",    color: "#0891b2" },
  { key: "pressure",       label: "Pressure",       unit: "hPa",  color: "#7c3aed" },
  { key: "wind_speed",     label: "Wind Speed",     unit: "m/s",  color: "#059669" },
  { key: "wind_direction", label: "Wind Direction", unit: "°",    color: "#d97706" },
  { key: "rainfall",       label: "Rainfall",       unit: "mm",   color: "#2563eb" },
  { key: "irradiance",     label: "Irradiance",     unit: "W/m²", color: "#ea580c" },
] as const;

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import {
  Thermometer,
  Droplets,
  Gauge,
  Activity,
  CloudRain,
  Calendar,
  AlertTriangle,
  History,
  ShieldAlert
} from "lucide-react";

const COLORS = ["#4f46e5", "#cbd5e1", "#f59e0b", "#ef4444"];

export default function AnalyticsPage() {
  const analytics = useAnalyticsData();
  const liveReadings = useLiveReadings(96);   // 20-min nested store
  const hourlyReadings = useHourlyTrend(168); // hourly nested store
  const liveNow = useWeatherData();
  const [trendKey, setTrendKey] = useState<(typeof TREND_PARAMS)[number]["key"]>("temperature");
  const [resolution, setResolution] = useState<"hourly" | "20min">("hourly");
  const { anomalies, analyzedPoints } = useAnomalies();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { role, loading } = useUserRole();

  const trendParam = TREND_PARAMS.find((p) => p.key === trendKey)!;

  // Avoid chart text hydration flickering across server configurations
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium tracking-wide">Loading Analytics...</span>
        </div>
      </div>
    );
  }

  if (loading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium tracking-wide">Loading Operational Matrix...</span>
        </div>
      </div>
    );
  }

  // Trend source follows the resolution toggle: hourly_trend (1 point/hour)
  // or sensor_history (1 point/20-min). Falls back to the other if the chosen
  // one is still empty so the chart is never blank right after a fresh start.
  const hourlySrc = hourlyReadings.length ? hourlyReadings : liveReadings;
  const twentySrc = liveReadings.length ? liveReadings : hourlyReadings;
  const trendSrc = resolution === "hourly" ? hourlySrc : twentySrc;
  const hourlyData = trendSrc.map((r) => ({ hour: r.label, value: (r as any)[trendKey] ?? null }));

  const rainfallData = [
    {
      name: "Rain Events",
      value: analytics.rainfall?.rain_events || 0,
    },
    {
      name: "No Rain",
      value: analytics.rainfall?.no_rain_events || 0,
    },
  ];

  const dailyMetrics = [
    {
      metric: "Temperature",
      value: analytics.daily?.avg_temperature || 0,
    },
    {
      metric: "Humidity",
      value: analytics.daily?.avg_humidity || 0,
    },
    {
      metric: "Pressure",
      value: analytics.daily?.avg_pressure || 0,
    },
  ];
  // Actual = live Bresser payload; Predicted = SmartWeatherAI next-hour
  // forecast (prediction/next_hour, written every cycle by the pipeline).
  const nextHour = analytics.prediction?.next_hour ?? analytics.prediction?.next20min ?? {};
  const predictionData = [
    { metric: "Temp °C",    actual: liveNow?.temperature ?? 0, predicted: nextHour.temperature ?? 0 },
    { metric: "Humidity %", actual: liveNow?.humidity ?? 0,    predicted: nextHour.humidity ?? 0 },
    { metric: "Wind m/s",   actual: liveNow?.wind_speed ?? 0,  predicted: nextHour.wind_speed ?? 0 },
    { metric: "Rain mm",    actual: liveNow?.rain ?? 0,        predicted: nextHour.rainfall ?? 0 },
    { metric: "Irrad W/m²", actual: liveNow?.irradiance ?? 0,  predicted: nextHour.irradiance ?? 0 },
  ];

  // Dynamic colors for internal Recharts engines
  const gridColor = mounted && theme === "dark" ? "#1e293b" : "#f1f5f9";
  const axisColor = mounted && theme === "dark" ? "#94a3b8" : "#64748b";
  const tooltipBg = mounted && theme === "dark" ? "#0f172a" : "#ffffff";
  const tooltipBorder = mounted && theme === "dark" ? "#334155" : "#e2e8f0";

  return (
    <AuthGuard>
      <RouteGuard allowedRole={role}>
        <DashboardLayout role={role}>
          <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">

            {/* CLASSIC B2B HEADER BLOCK */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Weather Analytics Dashboard
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  Historical trends, sensory correlation parameters, and physical node threshold analytics.
                </p>
              </div>

              <div className="inline-flex items-center self-start md:self-auto gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200">
                <Activity size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Analytics Active</span>
              </div>
            </div>

            {/* METRIC CARDS BENTO GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Avg Temperature"
                value={`${analytics.daily?.avg_temperature?.toFixed(1) ?? "0.0"} °C`}
                icon={<Thermometer size={16} className="text-indigo-600 dark:text-indigo-400" />}
              />
              <MetricCard
                title="Avg Humidity"
                value={`${analytics.daily?.avg_humidity?.toFixed(1) ?? "0.0"} %`}
                icon={<Droplets size={16} className="text-indigo-600 dark:text-indigo-400" />}
              />
              <MetricCard
                title="Avg Pressure"
                value={`${analytics.daily?.avg_pressure?.toFixed(1) ?? "0.0"} hPa`}
                icon={<Gauge size={16} className="text-indigo-600 dark:text-indigo-400" />}
              />
              <MetricCard
                title="Total Readings"
                value={analytics.daily?.total_readings ?? 0}
                icon={<History size={16} className="text-indigo-600 dark:text-indigo-400" />}
              />
            </div>

            {/* LANDSCAPE TIMELINE GRAPH */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-800">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    {resolution === "hourly" ? "Hourly" : "20-Minute"} {trendParam.label} Trend
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {resolution === "hourly"
                      ? "One aggregated reading per hour from the Bresser station."
                      : "Aggregated reading every 20 minutes from the Bresser station."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* resolution toggle */}
                  <div className="flex rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden mr-1">
                    {(["hourly", "20min"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setResolution(r)}
                        className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          resolution === r
                            ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900"
                            : "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {r === "hourly" ? "Hourly" : "20-min"}
                      </button>
                    ))}
                  </div>
                  {TREND_PARAMS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setTrendKey(p.key)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                        trendKey === p.key
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-80 w-full">
                {hourlyData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">
                    No hourly {trendParam.label.toLowerCase()} history yet — the pipeline logs one reading per hour.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="hour" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} unit={trendParam.unit === "°C" ? "°" : ""} />
                      <Tooltip
                        formatter={(v: any) => [`${Number(v).toFixed(2)} ${trendParam.unit}`, trendParam.label]}
                        contentStyle={{ fontSize: '11px', borderRadius: '8px', background: tooltipBg, border: `1px solid ${tooltipBorder}`, color: mounted && theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                      />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name={trendParam.label}
                        stroke={trendParam.color}
                        strokeWidth={2.5}
                        dot={{ r: 0 }}
                        activeDot={{ r: 4, stroke: trendParam.color, strokeWidth: 1, fill: '#ffffff' }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* MID COLUMN GRID ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* PRECIPITATION RATIO GRAPH */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-sm transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-800">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Rainfall Distribution</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Proportional ratio of precipitation events.</p>
                  </div>
                  <CloudRain size={15} className="text-slate-400 dark:text-slate-500" />
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={rainfallData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={65}
                        stroke={mounted && theme === "dark" ? "#1e293b" : "#ffffff"}
                        strokeWidth={2}
                        paddingAngle={4}
                        label={{ fontSize: '10px', fill: axisColor, fontWeight: 600 }}
                      >
                        {rainfallData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', background: tooltipBg, border: `1px solid ${tooltipBorder}` }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* HISTORICAL BAR AVERAGES */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-sm transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-800">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Daily Weather Metrics</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Aggregate values for tracking parameters.</p>
                  </div>
                  <Activity size={15} className="text-slate-400 dark:text-slate-500" />
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="metric" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: mounted && theme === 'dark' ? '#1e293b' : '#f8fafc' }} contentStyle={{ fontSize: '11px', borderRadius: '8px', background: tooltipBg, border: `1px solid ${tooltipBorder}` }} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-sm">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-5">
                <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  Actual vs Predicted Weather
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  SmartWeatherAI next-hour forecast compared with the live Bresser reading.
                </p>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={predictionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Legend />

                    <Bar
                      dataKey="actual"
                      fill="#4f46e5"
                      name="Actual"
                    />

                    <Bar
                      dataKey="predicted"
                      fill="#06b6d4"
                      name="Predicted"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* METRICS AGE OVERVIEW LAYER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* WEEKLY METRICS COLUMN */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-sm transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-800">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Weekly Analytics</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Rolling 7-day environmental summary averages.</p>
                  </div>
                  <Calendar size={15} className="text-slate-400 dark:text-slate-500" />
                </div>

                <div className="space-y-1">
                  <LogValueRow label="Avg Temperature" value={`${analytics.weekly?.avg_temperature?.toFixed(1) ?? "0.0"} °C`} />
                  <LogValueRow label="Avg Humidity" value={`${analytics.weekly?.avg_humidity?.toFixed(1) ?? "0.0"} %`} />
                  <LogValueRow label="Avg Pressure" value={`${analytics.weekly?.avg_pressure?.toFixed(1) ?? "0.0"} hPa`} />
                  <LogValueRow label="Log Readings Count" value={analytics.weekly?.total_readings ?? 0} isMeta={true} />
                </div>
              </div>

              {/* MONTHLY METRICS COLUMN */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-sm transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-800">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Monthly Analytics</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Comprehensive 30-day structural tracking log.</p>
                  </div>
                  <Calendar size={15} className="text-slate-400 dark:text-slate-500" />
                </div>

                <div className="space-y-1">
                  <LogValueRow label="Avg Temperature" value={`${analytics.monthly?.avg_temperature?.toFixed(1) ?? "0.0"} °C`} />
                  <LogValueRow label="Avg Humidity" value={`${analytics.monthly?.avg_humidity?.toFixed(1) ?? "0.0"} %`} />
                  <LogValueRow label="Avg Pressure" value={`${analytics.monthly?.avg_pressure?.toFixed(1) ?? "0.0"} hPa`} />
                  <LogValueRow label="Log Readings Count" value={analytics.monthly?.total_readings ?? 0} isMeta={true} />
                </div>
              </div>
            </div>

            {/* ANOMALY DETECTION ENGINE OUTPUT */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-6 shadow-sm transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-800">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Anomaly Detection Array</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Automated sensory boundary violation calculations.</p>
                </div>
                <ShieldAlert size={15} className="text-slate-400 dark:text-slate-500" />
              </div>

              {anomalies.length === 0 ? (
                <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <ShieldAlert size={15} className="text-emerald-500" />
                    <h4 className="text-sm font-bold">
                      {analyzedPoints < 8
                        ? `Building baseline (${analyzedPoints} readings so far)…`
                        : "No anomalies — all parameters within normal range"}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded border uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40">
                    Status Nominal
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  {anomalies.map((a) => (
                    <div
                      key={a.parameter}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border ${
                        a.severity === "severe"
                          ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40"
                          : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                          <AlertTriangle size={15} className={a.severity === "severe" ? "text-rose-500" : "text-amber-500"} />
                          <h4 className="text-sm font-bold">
                            {a.label} {a.direction === "high" ? "spike" : "drop"}:{" "}
                            <span className="font-extrabold text-slate-900 dark:text-white">{a.value}{a.unit}</span>
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium pl-6">
                          Expected ≈ {a.mean}{a.unit} (±{a.std}); z-score {a.z} — {Math.abs(a.z)}σ from baseline.
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded border uppercase self-start sm:self-auto ${
                        a.severity === "severe"
                          ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/40"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40"
                      }`}>
                        {a.severity === "severe" ? "Severe" : "Attention"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </DashboardLayout>
      </RouteGuard>
    </AuthGuard>
  );
}

/* ---------- Local Dashboard Layout Modules ---------- */

function MetricCard({ title, value, icon }: { title: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-5 flex items-center justify-between transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-800 shadow-sm group">
      <div className="space-y-2">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase leading-none">
          {title}
        </p>
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
          {value}
        </h3>
      </div>
      {icon && (
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/40 dark:border-slate-700/60 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 group-hover:border-indigo-100 dark:group-hover:border-indigo-900 transition-colors shrink-0">
          {icon}
        </div>
      )}
    </div>
  );
}

function LogValueRow({ label, value, isMeta }: { label: string; value: string | number; isMeta?: boolean }) {
  return (
    <div className="bg-slate-50/40 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg px-4 py-3 flex justify-between items-center border border-slate-100 dark:border-slate-800/60 transition-colors duration-150">
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      <span className={`text-xs font-bold ${isMeta ? "text-indigo-600 dark:text-indigo-400" : "text-slate-800 dark:text-slate-200"}`}>
        {value}
      </span>
    </div>
  );
}