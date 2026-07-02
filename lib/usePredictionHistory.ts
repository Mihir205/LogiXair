"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";

export type PredictionPoint = {
  timestamp: string;
  predicted: {
    temperature: number;
    humidity: number;
    wind_speed: number;
    wind_direction: number;
    rainfall: number;
    pressure: number;
    irradiance: number;
  };
  actual?: {
    temperature: number;
    humidity: number;
    wind_speed: number;
    wind_direction: number;
    rainfall: number;
    pressure: number;
    irradiance: number;
  };
};

/**
 * Reads the nested prediction_history/{date}/{time} store (best-model
 * forecast + the reading it was made from, every 20 min) and flattens it
 * to a time-ordered array for the live predicted-vs-actual line chart.
 */
export default function usePredictionHistory(limit = 100): PredictionPoint[] {
  const [history, setHistory] = useState<PredictionPoint[]>([]);

  useEffect(() => {
    const historyRef = ref(db, "prediction_history");

    const unsub = onValue(historyRef, (snap) => {
      const tree = snap.val();
      if (!tree) {
        setHistory([]);
        return;
      }
      const points: PredictionPoint[] = [];
      for (const date of Object.keys(tree)) {
        const times = tree[date] ?? {};
        for (const time of Object.keys(times)) {
          const rec = times[time];
          if (rec?.predicted) {
            points.push({
              timestamp: rec.timestamp ?? `${date}T${time}`,
              predicted: rec.predicted,
              actual: rec.actual,
            });
          }
        }
      }
      points.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      setHistory(points.slice(-limit));
    });

    return () => unsub();
  }, [limit]);

  return history;
}
