"use client";
import RouteGuard from "../../components/RouteGuard";
import AuthGuard from "../../components/AuthGuard";
import DashboardLayout from "../../components/DashboardLayout";
import useWeatherData from "../../../lib/useWeatherData";
import useDeviceHealth from "../../../lib/useDeviceHealth";
import { Cpu, CheckCircle2, XCircle, BarChart2, Wifi, Battery, Clock } from "lucide-react";

const SENSORS: { key: string; label: string; bus: string }[] = [
  { key: "temperature", label: "Temperature", bus: "Bresser 5-in-1" },
  { key: "humidity", label: "Humidity", bus: "Bresser 5-in-1" },
  { key: "wind_speed", label: "Wind Speed", bus: "Bresser anemometer" },
  { key: "wind_direction", label: "Wind Direction", bus: "Bresser vane" },
  { key: "rain", label: "Rainfall", bus: "Bresser gauge" },
  { key: "pressure", label: "Pressure", bus: "BMP280 (I²C)" },
  { key: "irradiance", label: "Irradiance", bus: "Solar sensor" },
];

function ago(sec: number | null): string {
  if (sec == null) return "never";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}
// RSSI (-120..-40 dBm) → 0..100%
const rssiPct = (dbm: number | null) =>
  dbm == null ? 0 : Math.max(0, Math.min(100, Math.round(((dbm + 120) / 80) * 100)));

export default function DiagnosticsPage() {
  const w = useWeatherData();
  const health = useDeviceHealth();

  const onlinePct = health?.lastSeenSec != null ? Math.max(0, 100 - Math.round((health.lastSeenSec / (20 * 60)) * 100)) : 0;

  return (
    <AuthGuard>
      <RouteGuard allowedRole="operator">
        <DashboardLayout role="operator">
          <div className="space-y-6 max-w-[1400px] mx-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Diagnostics</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  Live link telemetry, power, and per-sensor bus verification.
                </p>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm ${
                health?.online ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/60" : "bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/60"
              }`}>
                <Cpu size={14} className={health?.online ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"} />
                <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                  {health == null ? "Awaiting telemetry…" : health.online ? "Core Engine Nominal" : "Node Offline"}
                </span>
              </div>
            </div>

            {health == null ? (
              <div className="rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Waiting for the first telemetry packet…
              </div>
            ) : (
              <>
                {/* LINK / POWER */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm">
                  <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Runtime Telemetry</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Signal, power, and data freshness.</p>
                    </div>
                    <BarChart2 size={15} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <div className="space-y-1.5">
                    <MetricRow icon={<Wifi size={14} className="text-slate-500" />} label={`Signal Strength : ${health.signal.label}`} details={health.signal.dbm != null ? `${health.signal.dbm} dBm` : "no RSSI"} value={`${rssiPct(health.signal.dbm)}%`} pct={rssiPct(health.signal.dbm)} />
                    <MetricRow icon={<Battery size={14} className="text-slate-500" />} label={`Battery : ${health.battery.label}`} details="Node power reserve" value={health.battery.label} status={health.battery.level} />
                    <MetricRow icon={<Clock size={14} className="text-slate-500" />} label={`Data Freshness : ${ago(health.lastSeenSec)}`} details="Time since last packet" value={`${onlinePct}%`} pct={onlinePct} />
                  </div>
                </div>

                {/* SENSOR BUS */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm">
                  <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                    <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Sensor Bus Verification</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Each peripheral reporting a valid reading in the latest packet.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SENSORS.map((s) => {
                      const v = (w as any)?.[s.key];
                      const ok = typeof v === "number" && Number.isFinite(v);
                      return (
                        <div key={s.key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/40 p-3">
                          <div className="flex items-center gap-2">
                            {ok ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> : <XCircle size={14} className="text-rose-500 shrink-0" />}
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">{s.label}</p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{s.bus}</p>
                            </div>
                          </div>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                            ok ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40"
                               : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/40"
                          }`}>
                            {ok ? (typeof v === "number" ? v.toFixed(1) : "OK") : "No data"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </DashboardLayout>
      </RouteGuard>
    </AuthGuard>
  );
}

function MetricRow({ icon, label, details, value, pct, status }: any) {
  const statusColor: Record<string, string> = {
    good: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40",
    warn: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40",
    bad: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/40",
    unknown: "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60",
  };
  return (
    <div className="bg-slate-50/40 dark:bg-slate-950/40 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-slate-100 dark:border-slate-800/40">
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">{label}</h4>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium pl-6">{details}</p>
        {typeof pct === "number" && (
          <div className="w-full max-w-xs h-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-full overflow-hidden mt-2 ml-6">
            <div className={`h-full transition-all duration-300 ${pct < 30 ? "bg-rose-500" : pct < 60 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      <span className={`text-xs font-bold px-2.5 py-1 rounded border tracking-wide ${status ? statusColor[status] : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 shadow-sm"}`}>
        {value}
      </span>
    </div>
  );
}
