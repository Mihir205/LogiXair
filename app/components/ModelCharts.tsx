"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Legend,
} from "recharts";
import useModelMetrics, { ModelMetric } from "../../lib/useModelMetrics";
import useValidationHistory, { ValidationEntry, SensorReading } from "../../lib/useValidationHistory";
import { Sparkles, Sigma, TrendingUp, Radio, X } from "lucide-react";

/* ─────────────────────────────── CONSTANTS ─────────────────────────────── */

const SENSORS: { key: keyof SensorReading; label: string; unit: string; digits: number }[] = [
  { key: "temperature",     label: "Temperature",     unit: "°C",   digits: 2 },
  { key: "humidity",        label: "Humidity",        unit: "%",    digits: 1 },
  { key: "wind_speed",      label: "Wind Speed",      unit: "m/s",  digits: 2 },
  { key: "wind_direction",  label: "Wind Direction",  unit: "°",    digits: 0 },
  { key: "rainfall",        label: "Rainfall",        unit: "mm",   digits: 2 },
  { key: "pressure",        label: "Pressure",        unit: "hPa",  digits: 1 },
  { key: "irradiance",      label: "Irradiance",      unit: "W/m²", digits: 1 },
];

const MODEL_COLORS: Record<string, string> = {
  "XGBoost":            "#059669",
  "Random Forest":      "#6366f1",
  "Extra Trees":        "#f59e0b",
  "Linear Regression":  "#ef4444",
};

const fallbackColors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

type MetricKey = "test_r2" | "train_r2" | "mae" | "mse" | "rmse";

const METRICS: { key: MetricKey; label: string; higherBetter: boolean; digits: number; blurb: string }[] = [
  { key: "test_r2",  label: "Test R²",  higherBetter: true,  digits: 4, blurb: "fit to unseen data — closer to 1 is better" },
  { key: "train_r2", label: "Train R²", higherBetter: true,  digits: 4, blurb: "fit to training data — watch the gap vs test" },
  { key: "mae",      label: "MAE",      higherBetter: false, digits: 3, blurb: "mean absolute error — lower is better" },
  { key: "mse",      label: "MSE",      higherBetter: false, digits: 2, blurb: "mean squared error — punishes big misses" },
  { key: "rmse",     label: "RMSE",     higherBetter: false, digits: 3, blurb: "root mean squared error — lower is better" },
];

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ModelCharts() {
  const metrics = useModelMetrics();
  const history = useValidationHistory(100);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [sensorKey, setSensorKey] = useState<keyof SensorReading>("temperature");
  const [drillHour, setDrillHour] = useState<ValidationEntry | null>(null);
  const [metricKey, setMetricKey] = useState<MetricKey>("test_r2");

  const modelNames = metrics ? Object.keys(metrics.models) : [];
  const activeModel = selectedModel ?? metrics?.best ?? modelNames[0] ?? null;
  const bestMetric: ModelMetric | undefined =
    metrics && metrics.best ? metrics.models[metrics.best] : undefined;
  const sensor = SENSORS.find((s) => s.key === sensorKey)!;

  const metric = METRICS.find((m) => m.key === metricKey)!;

  const comparisonData = modelNames.map((name, i) => {
    const m = metrics!.models[name];
    return {
      name,
      shortName: name.replace(" Regression", ""),
      value: Number((m[metricKey] ?? 0).toFixed(metric.digits)),
      test_r2: m.test_r2,
      train_r2: m.train_r2,
      mae: m.mae,
      mse: m.mse,
      rmse: m.rmse,
      color: MODEL_COLORS[name] ?? fallbackColors[i % fallbackColors.length],
    };
  });

  // Winner for the SELECTED metric: highest for R², lowest for error metrics
  const winnerName = comparisonData.length
    ? [...comparisonData].sort((a, b) =>
        metric.higherBetter ? b.value - a.value : a.value - b.value
      )[0].name
    : null;

  // Auto-scaled Y domain so tiny differences between models stay visible
  const values = comparisonData.map((d) => d.value);
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const pad = Math.max((vMax - vMin) * 0.35, vMax * 0.002, 1e-6);
  const yDomain: [number, number] = metric.higherBetter
    ? [Math.max(0, vMin - pad), Math.min(1, vMax + pad)]
    : [Math.max(0, vMin - pad), vMax + pad];

  const activeSamples = activeModel ? metrics?.models[activeModel]?.samples : undefined;
  const activeMetric = activeModel ? metrics?.models[activeModel] : undefined;

  const timeSeriesData = useMemo(
    () =>
      history.map((entry) => {
        // entry.hour is "YYYY-MM-DD HH:MM" — show the real clock time (HH:MM),
        // not the minute slice. Falls back to the raw value if unexpected.
        const clock = entry.hour.split(/[ T]/)[1] ?? entry.hour;
        const point: Record<string, any> = {
          time: clock,
          hour: entry.hour,
          _entry: entry,
          actual: entry.actual?.[sensorKey] ?? null,
        };
        for (const name of modelNames) {
          point[name] = entry.predictions?.[name]?.[sensorKey] ?? null;
        }
        return point;
      }),
    [history, sensorKey, modelNames]
  );

  const latest = timeSeriesData[timeSeriesData.length - 1];
  const drift =
    latest?.actual != null && activeModel && latest[activeModel] != null
      ? latest.actual - latest[activeModel]
      : null;

  /* ─────────────────────────────── EMPTY STATE ─────────────────────────────── */
  if (!metrics) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-12 text-center">
        <Sigma className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={36} />
        <p className="font-editorial text-2xl text-slate-500 dark:text-slate-400">
          Awaiting first model cycle…
        </p>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
          Run the SmartWeatherAI pipeline to populate <span className="font-mono-data">/model_metrics</span>.
          The dashboard will materialize the moment data lands in Firebase.
        </p>
      </section>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════════ */
  return (
    <section className="space-y-10 pt-6">

      {/* MASTHEAD */}
      <header className="relative border-t border-b border-slate-900/10 dark:border-white/10 py-8 my-2">
        <div className="flex items-baseline gap-3 mb-3">
          <span className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-emerald-700 dark:text-emerald-400">
            § Machine Learning Analytics
          </span>
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          {metrics.updatedAt && (
            <span className="font-mono-data text-[10px] tracking-wide text-slate-500 dark:text-slate-400">
              updated {timeAgo(metrics.updatedAt)}
            </span>
          )}
        </div>

        <h2 className="font-editorial text-4xl md:text-5xl font-light tracking-tight text-slate-900 dark:text-white leading-[1.05]">
          Four models trained.<br />
          <em className="italic font-normal text-emerald-700 dark:text-emerald-400">
            One takes the field.
          </em>
        </h2>

        <p className="mt-4 max-w-2xl text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Every training cycle, four regression architectures learn from
          <span className="font-mono-data text-slate-800 dark:text-slate-200"> two years </span>
          of NASA POWER hourly observations for this station's coordinates. Their forecasts
          are then held up against the live Bresser 5-in-1 telemetry, hour by hour.
        </p>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono-data text-[11px] tracking-wide text-slate-500 dark:text-slate-500">
          <MetaItem label="Cadence"     value="30 min" />
          <MetaItem label="Target"      value="t+1h forecast" />
          <MetaItem label="Sensors"     value="7 parameters" />
          <MetaItem label="Models"      value={String(modelNames.length)} />
        </div>
      </header>

      {/* CHAMPION HERO */}
      {metrics.best && bestMetric && (
        <div className="relative overflow-hidden rounded-3xl border border-emerald-900/20 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50 via-white to-slate-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-950 p-8 md:p-10">
          <div className="absolute inset-0 grid-texture opacity-60 pointer-events-none" />
          <div className="absolute top-6 right-6 opacity-[0.06] pointer-events-none">
            <Sparkles size={180} className="text-emerald-900 dark:text-emerald-300" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-mono-data text-[10px] tracking-[0.3em] uppercase text-emerald-700 dark:text-emerald-400">
                Currently operational · Champion
              </span>
            </div>
            <h3 className="font-editorial text-6xl md:text-7xl font-light tracking-tight text-slate-900 dark:text-white leading-none">
              {metrics.best}
            </h3>
            <p className="mt-4 max-w-xl text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic font-editorial">
              {narrateBest(metrics.best, bestMetric)}
            </p>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
              <HeroStat label="Test R²"   value={bestMetric.test_r2}  digits={4} glow />
              <HeroStat label="Train R²"  value={bestMetric.train_r2} digits={4} />
              <HeroStat label="MAE"       value={bestMetric.mae}      digits={3} />
              <HeroStat label="RMSE"      value={bestMetric.rmse}     digits={3} />
            </div>
          </div>
        </div>
      )}

      {/* § 01 — MODEL COMPARISON BAR (metric selectable) */}
      <ChapterCard
        chapter="01"
        title="Head-to-head"
        subtitle={`${metric.label} by model — ${metric.blurb}.`}
        insight={insightForComparison(comparisonData, metric, winnerName)}
        headerAside={
          <select
            value={metricKey}
            onChange={(e) => setMetricKey(e.target.value as MetricKey)}
            className="font-mono-data text-[11px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        }
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 20, right: 16, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis dataKey="shortName" tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "currentColor" }} className="text-slate-500" axisLine={false} tickLine={false} />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "currentColor" }}
                className="text-slate-400"
                axisLine={false}
                tickLine={false}
                width={64}
                tickFormatter={(v: number) => v.toFixed(metric.digits)}
              />
              <Tooltip content={<EditorialTooltip />} />
              <Bar dataKey="value" name={metric.label} radius={[6, 6, 0, 0]}>
                {comparisonData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.color}
                    fillOpacity={entry.name === winnerName ? 1 : 0.35}
                    stroke={entry.name === winnerName ? entry.color : "transparent"}
                    strokeWidth={2}
                    cursor="pointer"
                    onClick={() => setSelectedModel(entry.name)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="font-mono-data text-[10px] tracking-wide text-slate-400 uppercase">
            → click a bar to inspect that model in § 02
          </p>
          <p className="font-mono-data text-[10px] tracking-wide uppercase text-emerald-600 dark:text-emerald-400">
            {metric.higherBetter ? "▲ higher is better" : "▼ lower is better"}
          </p>
        </div>
      </ChapterCard>

      {/* § 02 — SCATTER */}
      <ChapterCard
        chapter="02"
        title={activeModel ?? "Model"}
        subtitle="Predicted vs actual temperature on NASA held-out data. The diagonal is a perfect fit."
        insight={insightForScatter(activeMetric)}
        headerAside={
          <select
            value={activeModel ?? ""}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="font-mono-data text-[11px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {modelNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        }
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 24, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis type="number" dataKey="actual" name="Actual" unit="°C" domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "currentColor" }} className="text-slate-500" axisLine={false} tickLine={false} label={{ value: "ACTUAL °C", position: "insideBottom", offset: -12, style: { fontSize: 10, fontFamily: "JetBrains Mono", letterSpacing: "0.15em", fill: "#94a3b8" } }} />
              <YAxis type="number" dataKey="predicted" name="Predicted" unit="°C" domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "currentColor" }} className="text-slate-500" axisLine={false} tickLine={false} label={{ value: "PREDICTED °C", angle: -90, position: "insideLeft", offset: 12, style: { fontSize: 10, fontFamily: "JetBrains Mono", letterSpacing: "0.15em", fill: "#94a3b8" } }} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<EditorialTooltip />} />
              <ReferenceLine segment={[{ x: -10, y: -10 }, { x: 60, y: 60 }]} stroke="#94a3b8" strokeDasharray="6 6" ifOverflow="extendDomain" label={{ value: "y = x", position: "insideTopRight", fontSize: 10, fill: "#94a3b8", fontFamily: "JetBrains Mono" }} />
              <Scatter name="Train" data={activeSamples?.train ?? []} fill="#6366f1" fillOpacity={0.55} shape="circle" />
              <Scatter name="Test"  data={activeSamples?.test ?? []}  fill="#ef4444" fillOpacity={0.75} shape="triangle" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-dashed border-slate-200 dark:border-slate-800">
          <MetricReadout label="Train R²" value={activeMetric?.train_r2} digits={4} />
          <MetricReadout label="Test R²"  value={activeMetric?.test_r2}  digits={4} highlight />
          <MetricReadout label="MAE"      value={activeMetric?.mae}      digits={3} />
          <MetricReadout label="RMSE"     value={activeMetric?.rmse}     digits={3} />
        </div>
      </ChapterCard>

      {/* § 03 — LIVE VALIDATION HISTORY (SENSOR × MODEL) */}
      <ChapterCard
        chapter="03"
        title="The live ledger"
        subtitle={`Actual vs predicted ${sensor.label.toLowerCase()}, every 20 minutes, from the Bresser feed.`}
        insight={insightForTimeSeries(drift, timeSeriesData.length, sensor)}
        headerAside={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <select
              value={sensorKey}
              onChange={(e) => setSensorKey(e.target.value as keyof SensorReading)}
              className="font-mono-data text-[11px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {SENSORS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            <select
              value={activeModel ?? ""}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="font-mono-data text-[11px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {modelNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 text-[10px] font-mono-data tracking-wide uppercase text-emerald-700 dark:text-emerald-400">
              <Radio size={12} /> live
            </div>
          </div>
        }
      >
        <div className="h-80">
          {timeSeriesData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
              <TrendingUp size={28} className="text-slate-300 dark:text-slate-700" />
              <p className="font-editorial italic text-sm">The ledger hasn't opened yet.</p>
              <p className="text-xs">First actual-vs-predicted record lands ~20 min after the pipeline starts running.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 20, right: 16, left: -8, bottom: 0 }}
                onClick={(state: any) => {
                  const entry = state?.activePayload?.[0]?.payload?._entry;
                  if (entry) setDrillHour(entry);
                }}
              >
                <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "currentColor" }} className="text-slate-500" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "currentColor" }} className="text-slate-500" axisLine={false} tickLine={false} width={44} unit={sensor.unit === "°" ? "°" : ""} />
                <Tooltip content={<EditorialTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#059669", cursor: "pointer" }}
                  name="Actual (Bresser)"
                  connectNulls
                />
                {activeModel && (
                  <Line
                    type="monotone"
                    dataKey={activeModel}
                    stroke={MODEL_COLORS[activeModel] ?? "#6366f1"}
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    dot={{ r: 3, fill: MODEL_COLORS[activeModel] ?? "#6366f1", cursor: "pointer" }}
                    name={`Predicted (${activeModel})`}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <p className="font-mono-data text-[10px] tracking-wide text-slate-400 mt-3 uppercase">
          → click any point to see all 4 models for that hour
        </p>
      </ChapterCard>

      <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono-data tracking-widest uppercase text-slate-400">
        <span>End of analytics</span>
        <span>SmartWeatherAI × LogiXair · v2</span>
      </div>

      {/* DRILL-DOWN MODAL */}
      {drillHour && (
        <DrillModal entry={drillHour} onClose={() => setDrillHour(null)} modelNames={modelNames} />
      )}
    </section>
  );
}

/* ─────────────────────────────── DRILL MODAL ─────────────────────────────── */

function DrillModal({
  entry, onClose, modelNames,
}: {
  entry: ValidationEntry;
  onClose: () => void;
  modelNames: string[];
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <div>
            <p className="font-mono-data text-[10px] tracking-[0.3em] uppercase text-slate-400">Slot Ledger</p>
            <h4 className="font-editorial text-2xl font-light text-slate-900 dark:text-white">
              {entry.hour.replace("T", " · ")}
            </h4>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="pb-3 font-mono-data text-[9px] tracking-widest uppercase text-slate-400">Sensor</th>
                <th className="pb-3 font-mono-data text-[9px] tracking-widest uppercase text-emerald-600">Actual</th>
                {modelNames.map((name) => (
                  <th key={name} className="pb-3 font-mono-data text-[9px] tracking-widest uppercase" style={{ color: MODEL_COLORS[name] ?? "#6366f1" }}>
                    {name.replace(" Regression", "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SENSORS.map((s) => {
                const actual = entry.actual?.[s.key];
                return (
                  <tr key={s.key} className="border-t border-slate-100 dark:border-slate-800/60">
                    <td className="py-3 font-editorial italic text-slate-700 dark:text-slate-300">
                      {s.label} <span className="text-slate-400 not-italic font-mono-data text-[10px] ml-1">{s.unit}</span>
                    </td>
                    <td className="py-3 font-mono-data text-emerald-700 dark:text-emerald-400 font-medium">
                      {actual != null ? Number(actual).toFixed(s.digits) : "—"}
                    </td>
                    {modelNames.map((name) => {
                      const pred = entry.predictions?.[name]?.[s.key];
                      const delta = pred != null && actual != null ? pred - actual : null;
                      return (
                        <td key={name} className="py-3 font-mono-data text-slate-800 dark:text-slate-200">
                          {pred != null ? Number(pred).toFixed(s.digits) : "—"}
                          {delta != null && (
                            <span className={"ml-1.5 text-[10px] " + (Math.abs(delta) < 0.5 ? "text-emerald-500" : "text-slate-400")}>
                              {delta >= 0 ? "+" : ""}{delta.toFixed(s.digits)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── SUB-COMPONENTS ─────────────────────────────── */

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="text-slate-400 uppercase text-[9px]">{label}</span>
      <span className="text-slate-800 dark:text-slate-200">{value}</span>
    </span>
  );
}

function HeroStat({ label, value, digits = 3, glow = false }: { label: string; value?: number; digits?: number; glow?: boolean }) {
  return (
    <div>
      <p className="font-mono-data text-[10px] tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">{label}</p>
      <p className={"font-editorial text-3xl md:text-4xl font-light tracking-tight mt-1 " + (glow ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white")}>
        {value != null ? value.toFixed(digits) : "—"}
      </p>
    </div>
  );
}

function ChapterCard({ chapter, title, subtitle, insight, headerAside, children }: {
  chapter: string; title: string; subtitle: string; insight?: string; headerAside?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden">
      <div className="p-8 md:p-10">
        <div className="flex items-start justify-between gap-6 mb-6 pb-6 border-b border-dashed border-slate-200 dark:border-slate-800">
          <div className="flex-1">
            <div className="font-mono-data text-[10px] tracking-[0.3em] uppercase text-slate-400 mb-2">§ {chapter}</div>
            <h3 className="font-editorial text-3xl md:text-4xl font-light tracking-tight text-slate-900 dark:text-white leading-tight">{title}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-editorial italic">{subtitle}</p>
          </div>
          {headerAside && <div className="shrink-0 pt-1">{headerAside}</div>}
        </div>
        {children}
        {insight && (
          <div className="mt-6 flex items-start gap-3 pt-6 border-t border-slate-100 dark:border-slate-800/60">
            <div className="mt-1 h-px w-8 bg-slate-300 dark:bg-slate-700 shrink-0" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-editorial italic leading-relaxed">{insight}</p>
          </div>
        )}
      </div>
    </article>
  );
}

function MetricReadout({ label, value, digits = 3, highlight = false }: { label: string; value?: number; digits?: number; highlight?: boolean }) {
  return (
    <div className={"rounded-lg px-4 py-3 border " + (highlight ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20" : "border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40")}>
      <p className="font-mono-data text-[9px] tracking-[0.2em] uppercase text-slate-400">{label}</p>
      <p className={"font-mono-data text-xl font-medium mt-0.5 " + (highlight ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white")}>
        {value != null ? value.toFixed(digits) : "—"}
      </p>
    </div>
  );
}

function EditorialTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-slate-900/95 dark:bg-black/90 backdrop-blur border border-slate-800 px-3 py-2 shadow-xl">
      {label && (
        <p className="font-mono-data text-[10px] uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      )}
      {payload.filter((p: any) => p.dataKey !== "_entry" && p.dataKey !== "hour" && p.value != null).map((p: any, i: number) => (
        <p key={i} className="font-mono-data text-xs text-slate-100">
          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: p.color }} />
          {p.name}: <span className="text-white font-medium">{typeof p.value === "number" ? p.value.toFixed(3) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ─────────────────────────────── NARRATIVE HELPERS ─────────────────────────────── */

function narrateBest(name: string, m: ModelMetric): string {
  const r2Pct = (m.test_r2 * 100).toFixed(1);
  const mae = m.mae.toFixed(2);
  if (name.includes("XGBoost")) return `A gradient-boosted ensemble. Explains ${r2Pct}% of variance on held-out data with an average error of ${mae}. Fast, gnarly, hard to beat on tabular weather.`;
  if (name.includes("Random Forest")) return `A parliament of 200 decision trees. ${r2Pct}% variance explained, MAE ${mae}. Steady, robust, unshaken by outliers.`;
  if (name.includes("Extra Trees")) return `Extremely randomized trees — ${r2Pct}% R², MAE ${mae}. Trades a hint of bias for speed and generalization.`;
  return `${r2Pct}% variance explained on unseen data. MAE ${mae}. Currently the operational forecast.`;
}

function insightForComparison(
  rows: any[],
  metric: { key: string; label: string; higherBetter: boolean; digits: number },
  winnerName: string | null
): string {
  if (rows.length < 2 || !winnerName) return "";
  const sorted = [...rows].sort((a, b) =>
    metric.higherBetter ? b.value - a.value : a.value - b.value
  );
  const gap = Math.abs(sorted[0].value - sorted[1].value);
  const gapStr = gap.toFixed(metric.digits);
  const relative = sorted[1].value !== 0
    ? ` (${((gap / Math.abs(sorted[1].value)) * 100).toFixed(1)}% ${metric.higherBetter ? "ahead of" : "below"} the runner-up)`
    : "";

  if (metric.key === "train_r2") {
    const suspicious = sorted.find((r) => r.train_r2 > 0.999);
    if (suspicious) {
      return `${suspicious.name} scores a near-perfect train R² — check its test score before trusting it; perfect memory often means weak generalization.`;
    }
  }
  if (gap < (metric.higherBetter ? 0.005 : sorted[1].value * 0.02)) {
    return `On ${metric.label}, the field is separated by just ${gapStr} — a photo finish. When it's this close, retraining cadence matters more than model choice.`;
  }
  return `${sorted[0].name} takes ${metric.label} at ${sorted[0].value.toFixed(metric.digits)}${relative}. A meaningful margin — not an accident.`;
}

function insightForScatter(m?: ModelMetric): string {
  if (!m) return "";
  const overfit = m.train_r2 - m.test_r2;
  if (overfit > 0.05) return `Train R² leads test by ${overfit.toFixed(3)} — some memorization. Watch for drift when the season turns.`;
  if (overfit < 0.01) return `Train and test track together (Δ ${overfit.toFixed(3)}). The model is generalizing, not memorizing.`;
  return `A modest generalization gap of ${overfit.toFixed(3)}. Healthy territory.`;
}

function insightForTimeSeries(drift: number | null, n: number, sensor: { label: string; unit: string }): string {
  if (n === 0) return "";
  if (drift == null) return `${n} hours on the ledger. Waiting on live actuals to close the loop.`;
  const dir = drift > 0 ? "under-predicting" : "over-predicting";
  const mag = Math.abs(drift).toFixed(2);
  if (Math.abs(drift) < 0.5) return `Latest forecast within ${mag}${sensor.unit} of the live reading. On target.`;
  return `Latest forecast is ${dir} ${sensor.label.toLowerCase()} by ${mag}${sensor.unit}. A single point isn't a trend — but worth watching.`;
}

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const min = Math.round((now - then) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} h ago`;
  return `${Math.round(hr / 24)} d ago`;
}
