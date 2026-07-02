"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";

export type SensorReading = {
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  rainfall: number;
  pressure: number;
  irradiance: number;
};

export type ValidationEntry = {
  hour: string;
  actual: SensorReading;
  predictions: Record<string, SensorReading>;
};

/**
 * Reads the nested validation_history/{date}/{time} store (actual vs each
 * model's forecast, written every 20 min) and flattens it to a time-ordered
 * array for the ML drill-down charts.
 */
export default function useValidationHistory(limit = 100): ValidationEntry[] {
  const [history, setHistory] = useState<ValidationEntry[]>([]);

  useEffect(() => {
    const historyRef = ref(db, "validation_history");
    const unsub = onValue(historyRef, (snap) => {
      const tree = snap.val();
      if (!tree) return setHistory([]);

      const entries: ValidationEntry[] = [];
      for (const date of Object.keys(tree)) {
        const times = tree[date] ?? {};
        for (const time of Object.keys(times)) {
          const rec = times[time];
          if (rec?.actual && rec?.predictions) {
            entries.push({
              hour: rec.hour ?? `${date} ${time}`,
              actual: rec.actual,
              predictions: rec.predictions,
            });
          }
        }
      }
      entries.sort((a, b) => a.hour.localeCompare(b.hour));
      setHistory(entries.slice(-limit));
    });
    return () => unsub();
  }, [limit]);

  return history;
}
