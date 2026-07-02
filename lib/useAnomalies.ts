"use client";

import { useMemo } from "react";
import useLiveReadings from "./useLiveReadings";

export type Anomaly = {
  parameter: string;
  label: string;
  unit: string;
  value: number;
  mean: number;
  std: number;
  z: number;                    // signed z-score of the latest reading
  severity: "moderate" | "severe";
  direction: "high" | "low";
};

const PARAMS: { key: string; label: string; unit: string }[] = [
  { key: "temperature", label: "Temperature", unit: "°C" },
  { key: "humidity", label: "Humidity", unit: "%" },
  { key: "pressure", label: "Pressure", unit: "hPa" },
  { key: "wind_speed", label: "Wind Speed", unit: "m/s" },
  { key: "rainfall", label: "Rainfall", unit: "mm" },
  { key: "irradiance", label: "Irradiance", unit: "W/m²" },
];

const MIN_SAMPLES = 8;   // need enough history for meaningful stats
const MOD_Z = 2.5;       // |z| ≥ 2.5 → moderate
const SEV_Z = 3.5;       // |z| ≥ 3.5 → severe

/**
 * Statistical anomaly detector: over the recent nested sensor_history, flags
 * the latest reading of any parameter that sits far from its own recent mean
 * (z-score). Pure client-side, recomputes as new readings stream in.
 */
export default function useAnomalies(): { anomalies: Anomaly[]; analyzedPoints: number } {
  const readings = useLiveReadings(96);

  return useMemo(() => {
    if (readings.length < MIN_SAMPLES) {
      return { anomalies: [], analyzedPoints: readings.length };
    }

    const anomalies: Anomaly[] = [];

    for (const p of PARAMS) {
      const series = readings
        .map((r) => (r as any)[p.key])
        .filter((v) => typeof v === "number" && !Number.isNaN(v)) as number[];
      if (series.length < MIN_SAMPLES) continue;

      const latest = series[series.length - 1];
      // Stats over the PRIOR points (exclude the latest so it's tested against
      // its baseline, not against itself).
      const baseline = series.slice(0, -1);
      const mean = baseline.reduce((a, b) => a + b, 0) / baseline.length;
      const variance =
        baseline.reduce((a, b) => a + (b - mean) ** 2, 0) / baseline.length;
      const std = Math.sqrt(variance);
      if (std < 1e-6) continue; // flat series — nothing to flag

      const z = (latest - mean) / std;
      const absZ = Math.abs(z);
      if (absZ >= MOD_Z) {
        anomalies.push({
          parameter: p.key,
          label: p.label,
          unit: p.unit,
          value: Number(latest.toFixed(2)),
          mean: Number(mean.toFixed(2)),
          std: Number(std.toFixed(2)),
          z: Number(z.toFixed(2)),
          severity: absZ >= SEV_Z ? "severe" : "moderate",
          direction: z > 0 ? "high" : "low",
        });
      }
    }

    // Most extreme first.
    anomalies.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
    return { anomalies, analyzedPoints: readings.length };
  }, [readings]);
}
