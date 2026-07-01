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
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import useModelMetrics, { ModelMetric } from "../../lib/useModelMetrics";
import usePredictionHistory from "../../lib/usePredictionHistory";
import { Sparkles, Sigma, TrendingUp, Radio } from "lucide-react";

const PALETTE: Record<string, string> = {
  "XGBoost":            "#059669",
  "Random Forest":      "#6366f1",
  "Extra Trees":        "#f59e0b",
  "Linear Regression":  "#ef4444",
};

const fallbackColors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

export default function ModelCharts() {
  const metrics = useModelMetrics();
  const history = usePredictionHistory(100);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const modelNames = metrics ? Object.keys(metrics.models) : [];
  const activeModel = selectedModel ?? metrics?.best ?? modelNames[0] ?? null;
  const bestMetric: ModelMetric | undefined =
    metrics && metrics.best ? metrics.models[metrics.best] : undefined;

  const comparisonData = modelNames.map((name, i) => ({
    name,
    shortName: name.replace(" Regression", ""),
    "Test R²": Number((metrics!.models[name].test_r2 ?? 0).toFixed(4)),
    "Train R²": Number((metrics!.models[name].train_r2 ?? 0).toFixed(4)),
    color: PALETTE[name] ?? fallbackColors[i % fallbackColors.length],
    isBest: name === metrics?.best,
  }));

  const activeSamples =
    activeModel ? metrics?.models[activeModel]?.samples : undefined;
  const activeMetric =
    activeModel ? metrics?.models[activeModel] : undefined;

  const timeSeriesData = useMemo(
    () =>
      history.map((p) => ({
        time: new Date(p.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        predicted: p.predicted?.temperature != null
          ? Number(p.predicted.temperature.toFixed(2))
          : null,
        actual: p.actual?.temperature != null
          ? Number(p.actual.temperature.toFixed(2))
          : null,
      })),
    [history]
  );

  const latestPoint = timeSeriesData[timeSeriesData.length - 1];
  const drift =
    latestPoint?.actual != null && latestPoint?.predicted != null
      ? latestPoint.actual - latestPoint.predicted
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
          The dashboard will materialize automatically the moment data lands in Firebase.
        </p>
      </section>
    );
  }

  /* ────────────────────────────────── SECTION ──────────────────────────────── */
  return (
    <section className="space-y-10 pt-6">

      {/* ============================================================
          SECTION MASTHEAD — editorial title, lead, meta
         ============================================================ */}
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
          Every training cycle, four regression architectures are trained on
          <span className="font-mono-data text-slate-800 dark:text-slate-200"> 17,543 </span>
          hourly observations from the NASA POWER archive for this station's coordinates.
          Their forecasts are then held up against the live Bresser 5-in-1 telemetry.
          The best performer inherits the operational forecast until the next cycle.
        </p>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono-data text-[11px] tracking-wide text-slate-500 dark:text-slate-500">
          <MetaItem label="Coordinates" value="12.9716°N · 77.5946°E" />
          <MetaItem label="History" value="2 years hourly" />
          <MetaItem label="Cadence" value="30 min" />
          <MetaItem label="Target" value="t+1h temperature" />
        </div>
      </header>

      {/* ============================================================
          HERO — the champion model
         ============================================================ */}
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
              <HeroStat label="Test R²"   value={bestMetric.test_r2}  digits={4} suffix="" glow />
              <HeroStat label="Train R²"  value={bestMetric.train_r2} digits={4} />
              <HeroStat label="MAE"       value={bestMetric.mae}      digits={3} />
              <HeroStat label="RMSE"      value={bestMetric.rmse}     digits={3} />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          CHART 01 — MODEL COMPARISON
         ============================================================ */}
      <ChapterCard
        chapter="01"
        title="Head-to-head"
        subtitle="Test R² by model — closer to 1 is a tighter fit to unseen data."
        insight={insightForComparison(comparisonData)}
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 20, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "currentColor" }}
                className="text-slate-500"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0.9, 1]}
                tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "currentColor" }}
                className="text-slate-400"
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<EditorialTooltip />} />
              <Bar dataKey="Test R²" radius={[6, 6, 0, 0]}>
                {comparisonData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.color}
                    fillOpacity={entry.isBest ? 1 : 0.35}
                    stroke={entry.isBest ? entry.color : "transparent"}
                    strokeWidth={2}
                    cursor="pointer"
                    onClick={() => setSelectedModel(entry.name)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="font-mono-data text-[10px] tracking-wide text-slate-400 mt-3 uppercase">
          → click a bar to inspect that model in § 02
        </p>
      </ChapterCard>

      {/* ============================================================
          CHART 02 — SCATTER
         ============================================================ */}
      <ChapterCard
        chapter="02"
        title={activeModel ?? "Model"}
        subtitle="Predicted vs actual temperature. The diagonal line is perfect prediction."
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
              <XAxis
                type="number"
                dataKey="actual"
                name="Actual"
                unit="°C"
                domain={["dataMin - 2", "dataMax + 2"]}
                tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "currentColor" }}
                className="text-slate-500"
                axisLine={false}
                tickLine={false}
                label={{
                  value: "ACTUAL °C",
                  position: "insideBottom",
                  offset: -12,
                  style: { fontSize: 10, fontFamily: "JetBrains Mono", letterSpacing: "0.15em", fill: "#94a3b8" },
                }}
              />
              <YAxis
                type="number"
                dataKey="predicted"
                name="Predicted"
                unit="°C"
                domain={["dataMin - 2", "dataMax + 2"]}
                tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "currentColor" }}
                className="text-slate-500"
                axisLine={false}
                tickLine={false}
                label={{
                  value: "PREDICTED °C",
                  angle: -90,
                  position: "insideLeft",
                  offset: 12,
                  style: { fontSize: 10, fontFamily: "JetBrains Mono", letterSpacing: "0.15em", fill: "#94a3b8" },
                }}
              />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<EditorialTooltip />} />
              <ReferenceLine
                segment={[{ x: -10, y: -10 }, { x: 60, y: 60 }]}
                stroke="#94a3b8"
                strokeDasharray="6 6"
                ifOverflow="extendDomain"
                label={{ value: "y = x", position: "insideTopRight", fontSize: 10, fill: "#94a3b8", fontFamily: "JetBrains Mono" }}
              />
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

      {/* ============================================================
          CHART 03 — LIVE TIME SERIES
         ============================================================ */}
      <ChapterCard
        chapter="03"
        title="The live check"
        subtitle={`Forecast vs Bresser telemetry — last ${history.length} cycles.`}
        insight={insightForTimeSeries(drift, timeSeriesData.length)}
        headerAside={
          <div className="flex items-center gap-1.5 text-[10px] font-mono-data tracking-wide uppercase text-emerald-700 dark:text-emerald-400">
            <Radio size={12} />
            live
          </div>
        }
      >
        <div className="h-72">
          {timeSeriesData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
              <TrendingUp size={28} className="text-slate-300 dark:text-slate-700" />
              <p className="font-editorial italic text-sm">The story hasn't started yet.</p>
              <p className="text-xs">First prediction lands on the next cycle.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 20, right: 16, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "currentColor" }}
                  className="text-slate-500"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "currentColor" }}
                  className="text-slate-500"
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  unit="°"
                />
                <Tooltip content={<EditorialTooltip />} />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="url(#predGrad)"
                  strokeWidth={2.5}
                  dot={false}
                  name="Predicted"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#059669"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: "#059669" }}
                  name="Actual (Bresser)"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChapterCard>

      {/* ============================================================
          FOOTER — signature line
         ============================================================ */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono-data tracking-widest uppercase text-slate-400">
        <span>End of analytics</span>
        <span>SmartWeatherAI × LogiXair · v1</span>
      </div>
    </section>
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

function HeroStat({
  label, value, digits = 3, suffix = "", glow = false,
}: {
  label: string; value?: number; digits?: number; suffix?: string; glow?: boolean;
}) {
  return (
    <div>
      <p className="font-mono-data text-[10px] tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p
        className={
          "font-editorial text-3xl md:text-4xl font-light tracking-tight mt-1 " +
          (glow
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-slate-900 dark:text-white")
        }
      >
        {value != null ? value.toFixed(digits) : "—"}
        <span className="text-lg text-slate-400 ml-0.5">{suffix}</span>
      </p>
    </div>
  );
}

function ChapterCard({
  chapter, title, subtitle, insight, headerAside, children,
}: {
  chapter: string;
  title: string;
  subtitle: string;
  insight?: string;
  headerAside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden">
      <div className="p-8 md:p-10">
        <div className="flex items-start justify-between gap-6 mb-6 pb-6 border-b border-dashed border-slate-200 dark:border-slate-800">
          <div className="flex-1">
            <div className="font-mono-data text-[10px] tracking-[0.3em] uppercase text-slate-400 mb-2">
              § {chapter}
            </div>
            <h3 className="font-editorial text-3xl md:text-4xl font-light tracking-tight text-slate-900 dark:text-white leading-tight">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-editorial italic">
              {subtitle}
            </p>
          </div>
          {headerAside && <div className="shrink-0 pt-1">{headerAside}</div>}
        </div>

        {children}

        {insight && (
          <div className="mt-6 flex items-start gap-3 pt-6 border-t border-slate-100 dark:border-slate-800/60">
            <div className="mt-1 h-px w-8 bg-slate-300 dark:bg-slate-700 shrink-0" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-editorial italic leading-relaxed">
              {insight}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function MetricReadout({
  label, value, digits = 3, highlight = false,
}: {
  label: string; value?: number; digits?: number; highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg px-4 py-3 border " +
        (highlight
          ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20"
          : "border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40")
      }
    >
      <p className="font-mono-data text-[9px] tracking-[0.2em] uppercase text-slate-400">
        {label}
      </p>
      <p
        className={
          "font-mono-data text-xl font-medium mt-0.5 " +
          (highlight
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-slate-900 dark:text-white")
        }
      >
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
        <p className="font-mono-data text-[10px] uppercase tracking-wider text-slate-400 mb-1">
          {label}
        </p>
      )}
      {payload.map((p: any, i: number) => (
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
  if (name.includes("XGBoost")) {
    return `A gradient-boosted ensemble. Explains ${r2Pct}% of variance on held-out data with an average error of ${mae}. Fast, gnarly, hard to beat on tabular weather.`;
  }
  if (name.includes("Random Forest")) {
    return `A parliament of 200 decision trees. ${r2Pct}% variance explained, MAE ${mae}. Steady, robust, unshaken by outliers.`;
  }
  if (name.includes("Extra Trees")) {
    return `Extremely randomized trees — ${r2Pct}% R², MAE ${mae}. Trades a hint of bias for speed and generalization.`;
  }
  return `${r2Pct}% variance explained on unseen data. MAE ${mae}. Currently the operational forecast.`;
}

function insightForComparison(rows: any[]): string {
  if (rows.length < 2) return "";
  const sorted = [...rows].sort((a, b) => b["Test R²"] - a["Test R²"]);
  const gap = (sorted[0]["Test R²"] - sorted[1]["Test R²"]).toFixed(4);
  const bestGap = Number(gap);
  if (bestGap < 0.005) {
    return `The top three are within ${gap} R² of each other — a photo finish. When the champions are this close, cadence of retraining matters more than the choice.`;
  }
  return `${sorted[0].name} leads by ${gap} R² over ${sorted[1].name}. A meaningful margin — the winner is not accidental.`;
}

function insightForScatter(m?: ModelMetric): string {
  if (!m) return "";
  const overfit = m.train_r2 - m.test_r2;
  if (overfit > 0.05) {
    return `Train R² leads test by ${overfit.toFixed(3)} — some memorization. Watch for drift when the season turns.`;
  }
  if (overfit < 0.01) {
    return `Train and test track together (Δ ${overfit.toFixed(3)}). The model is generalizing, not memorizing.`;
  }
  return `A modest generalization gap of ${overfit.toFixed(3)}. Healthy territory.`;
}

function insightForTimeSeries(drift: number | null, n: number): string {
  if (n === 0) return "";
  if (drift == null) return `${n} predictions on the record. Waiting on live actuals to close the loop.`;
  const dir = drift > 0 ? "under-predicting" : "over-predicting";
  const mag = Math.abs(drift).toFixed(2);
  if (Math.abs(drift) < 0.5) return `Latest forecast within ${mag}°C of the live reading. On target.`;
  return `Latest forecast is ${dir} by ${mag}°C. A single point isn't a trend — but worth watching.`;
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
