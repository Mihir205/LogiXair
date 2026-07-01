"use client";

import { useState } from "react";
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
import useModelMetrics from "../../lib/useModelMetrics";
import usePredictionHistory from "../../lib/usePredictionHistory";
import { Cpu, Sparkles, LineChart as LineIcon, Activity } from "lucide-react";

const BAR_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

export default function ModelCharts() {
  const metrics = useModelMetrics();
  const history = usePredictionHistory(100);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const modelNames = metrics ? Object.keys(metrics.models) : [];
  const activeModel = selectedModel ?? metrics?.best ?? modelNames[0] ?? null;

  const comparisonData = modelNames.map((name) => ({
    name,
    "Test R²": Number((metrics!.models[name].test_r2 ?? 0).toFixed(4)),
    "Train R²": Number((metrics!.models[name].train_r2 ?? 0).toFixed(4)),
    RMSE: Number((metrics!.models[name].rmse ?? 0).toFixed(4)),
    isBest: name === metrics?.best,
  }));

  const activeSamples = activeModel
    ? metrics?.models[activeModel]?.samples
    : undefined;

  const timeSeriesData = history.map((p) => ({
    time: new Date(p.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    predicted: Number(p.predicted?.temperature?.toFixed(2)),
    actual: p.actual ? Number(p.actual?.temperature?.toFixed(2)) : null,
  }));

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-500" />
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            ML Model Analytics
          </h2>
        </div>
        {metrics?.updatedAt && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Updated: {new Date(metrics.updatedAt).toLocaleString()}
          </span>
        )}
      </div>

      {!metrics && (
        <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Waiting for model metrics… run the SmartWeatherAI training pipeline
          to populate <code>/model_metrics</code>.
        </div>
      )}

      {metrics && (
        <>
          {/* MODEL COMPARISON BAR CHART */}
          <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Model Comparison (Test R² — higher is better)
                </h3>
              </div>
              {metrics.best && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60">
                  Best: {metrics.best}
                </span>
              )}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Test R²">
                    {comparisonData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.isBest ? "#10b981" : BAR_COLORS[i % BAR_COLORS.length]}
                        cursor="pointer"
                        onClick={() => setSelectedModel(entry.name)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Click a bar to inspect that model's train/test scatter below.
            </p>
          </div>

          {/* TRAIN vs TEST SCATTER */}
          <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeModel} — Predicted vs Actual (temperature)
                </h3>
              </div>
              <select
                value={activeModel ?? ""}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-300"
              >
                {modelNames.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    dataKey="actual"
                    name="Actual"
                    tick={{ fontSize: 11 }}
                    label={{ value: "Actual (°C)", position: "insideBottom", offset: -5, fontSize: 11 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="predicted"
                    name="Predicted"
                    tick={{ fontSize: 11 }}
                    label={{ value: "Predicted (°C)", angle: -90, position: "insideLeft", fontSize: 11 }}
                  />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Legend />
                  <ReferenceLine
                    segment={[
                      { x: 0, y: 0 },
                      { x: 50, y: 50 },
                    ]}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    ifOverflow="extendDomain"
                  />
                  <Scatter name="Train" data={activeSamples?.train ?? []} fill="#6366f1" />
                  <Scatter name="Test" data={activeSamples?.test ?? []} fill="#ef4444" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-4">
              <MetricPill label="Train R²" value={metrics.models[activeModel!]?.train_r2} />
              <MetricPill label="Test R²" value={metrics.models[activeModel!]?.test_r2} />
              <MetricPill label="MAE" value={metrics.models[activeModel!]?.mae} />
              <MetricPill label="RMSE" value={metrics.models[activeModel!]?.rmse} />
            </div>
          </div>

          {/* LIVE PREDICTED vs ACTUAL TIME SERIES */}
          <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <LineIcon size={16} className="text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Predicted vs Actual Temperature (last {history.length} readings)
              </h3>
            </div>
            <div className="h-72">
              {timeSeriesData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                  Waiting for prediction history…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                      name="Predicted"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      name="Actual (Bresser)"
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-lg border border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="text-lg font-bold text-slate-900 dark:text-white">
        {value !== undefined ? value.toFixed(4) : "—"}
      </p>
    </div>
  );
}
