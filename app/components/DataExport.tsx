"use client";

import { useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "../../lib/firebase";
import usePlaces from "../../lib/usePlaces";
import { Download, MapPin, Calendar, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";

const FIELDS = [
  "temperature", "humidity", "wind_speed", "wind_direction",
  "rainfall", "pressure", "irradiance",
] as const;

type Kind = "readings" | "hourly" | "validation";

// CSV-escape a cell (quote if it contains comma/quote/newline).
function cell(v: any): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function fileSafe(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "location";
}

function triggerDownload(filename: string, csv: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Build the CSV text for one dataset kind.
function buildCsv(kind: Kind, dayTree: Record<string, any>, date: string): { rows: number; csv: string } {
  const times = Object.keys(dayTree).sort();
  if (kind === "validation") {
    // Collect the set of models seen across the day.
    const models = new Set<string>();
    for (const t of times) for (const m of Object.keys(dayTree[t]?.predictions ?? {})) models.add(m);
    const modelList = [...models].sort();
    const header = [
      "date", "time",
      ...FIELDS.map((f) => `actual_${f}`),
      ...modelList.flatMap((m) => FIELDS.map((f) => `${m}_${f}`)),
    ];
    const lines = [header.join(",")];
    for (const t of times) {
      const rec = dayTree[t];
      const a = rec?.actual ?? {};
      const row = [date, t, ...FIELDS.map((f) => cell(a[f]))];
      for (const m of modelList) {
        const p = rec?.predictions?.[m] ?? {};
        row.push(...FIELDS.map((f) => cell(p[f])));
      }
      lines.push(row.join(","));
    }
    return { rows: times.length, csv: lines.join("\n") };
  }

  // readings / hourly
  const withPred = kind === "hourly";
  const header = [
    "date", "time",
    ...FIELDS,
    ...(withPred ? FIELDS.map((f) => `predicted_${f}`) : []),
    "samples", "timestamp",
  ];
  const lines = [header.join(",")];
  for (const t of times) {
    const r = dayTree[t] ?? {};
    const row = [date, t, ...FIELDS.map((f) => cell(r[f]))];
    if (withPred) row.push(...FIELDS.map((f) => cell(r?.predicted?.[f])));
    row.push(cell(r.samples), cell(r.timestamp));
    lines.push(row.join(","));
  }
  return { rows: times.length, csv: lines.join("\n") };
}

export default function DataExport() {
  const places = usePlaces();
  const [placeKey, setPlaceKey] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState<Kind | "all" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const selected = places.find((p) => p.key === placeKey) ?? places[0];
  const activeKey = selected?.key ?? "";

  async function exportKind(kind: Kind): Promise<number> {
    const snap = await get(ref(db, `archive/${activeKey}/${kind}/${date}`));
    const tree = snap.val();
    if (!tree || Object.keys(tree).length === 0) return 0;
    const { rows, csv } = buildCsv(kind, tree, date);
    const name = `${fileSafe(selected?.place ?? activeKey)}_${date}_${kind}.csv`;
    triggerDownload(name, csv);
    return rows;
  }

  async function handleExport(kind: Kind | "all") {
    if (!activeKey) {
      setMsg({ ok: false, text: "No location selected." });
      return;
    }
    setBusy(kind);
    setMsg(null);
    try {
      const kinds: Kind[] = kind === "all" ? ["readings", "hourly", "validation"] : [kind];
      let total = 0;
      const empties: string[] = [];
      for (const k of kinds) {
        const n = await exportKind(k);
        total += n;
        if (n === 0) empties.push(k);
      }
      if (total === 0) {
        setMsg({ ok: false, text: `No ${kind === "all" ? "" : kind + " "}data for ${selected?.place} on ${date}.` });
      } else {
        setMsg({
          ok: true,
          text: `Downloaded ${total} rows${empties.length ? ` (no data for: ${empties.join(", ")})` : ""}.`,
        });
      }
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? "Export failed." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm p-6">
      <div className="flex items-center gap-2 pb-3 mb-5 border-b border-slate-100 dark:border-slate-800">
        <FileSpreadsheet size={16} className="text-indigo-600 dark:text-indigo-400" />
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Export Sensor Data (CSV)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Download 20-min readings, hourly trend, and actual-vs-predicted for any location and date.
          </p>
        </div>
      </div>

      {places.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-4">
          <AlertCircle size={15} /> No locations recorded yet — the pipeline registers a place once it stores data.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Place */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-1">
                <MapPin size={12} /> Location
              </label>
              <select
                value={activeKey}
                onChange={(e) => setPlaceKey(e.target.value)}
                className="w-full h-10 text-sm bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {places.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.place} ({p.latitude.toFixed(3)}, {p.longitude.toFixed(3)})
                  </option>
                ))}
              </select>
            </div>
            {/* Date */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-1">
                <Calendar size={12} /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 text-sm bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-5">
            <ExportBtn label="Readings (20-min)" onClick={() => handleExport("readings")} busy={busy === "readings"} primary />
            <ExportBtn label="Hourly" onClick={() => handleExport("hourly")} busy={busy === "hourly"} />
            <ExportBtn label="Actual vs Predicted" onClick={() => handleExport("validation")} busy={busy === "validation"} />
            <ExportBtn label="Export All" onClick={() => handleExport("all")} busy={busy === "all"} accent />
          </div>

          {msg && (
            <div className={`mt-4 inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border ${
              msg.ok
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40"
                : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40"
            }`}>
              {msg.text}
            </div>
          )}

          <p className="text-[11px] text-slate-400 mt-4">
            Files download as <span className="font-mono">{`{place}_{date}_{type}.csv`}</span> with real timestamps. Change the
            station coordinates and a new location appears here automatically.
          </p>
        </>
      )}
    </div>
  );
}

function ExportBtn({ label, onClick, busy, primary, accent }: {
  label: string; onClick: () => void; busy: boolean; primary?: boolean; accent?: boolean;
}) {
  const cls = accent
    ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700"
    : primary
      ? "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-700"
      : "bg-white dark:bg-slate-950 hover:border-indigo-400 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800";
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg border shadow-sm transition-all disabled:opacity-60 cursor-pointer active:scale-[0.98] ${cls}`}
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
      {label}
    </button>
  );
}
