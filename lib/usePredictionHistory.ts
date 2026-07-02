"use client";

import { useEffect, useState } from "react";
import { ref, onValue, query, limitToLast } from "firebase/database";
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

export default function usePredictionHistory(limit = 100): PredictionPoint[] {
  const [history, setHistory] = useState<PredictionPoint[]>([]);

  useEffect(() => {
    const historyRef = query(ref(db, "prediction_history"), limitToLast(limit));

    const unsub = onValue(historyRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setHistory([]);
        return;
      }

      const points: PredictionPoint[] = Object.values(data);
      points.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      setHistory(points);
    });

    return () => unsub();
  }, [limit]);

  return history;
}
