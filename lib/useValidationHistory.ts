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

export default function useValidationHistory(limit = 100): ValidationEntry[] {
  const [history, setHistory] = useState<ValidationEntry[]>([]);

  useEffect(() => {
    const historyRef = ref(db, "validation_history");
    const unsub = onValue(historyRef, (snap) => {
      const data = snap.val();
      if (!data) return setHistory([]);
      const entries: ValidationEntry[] = Object.values(data);
      entries.sort((a, b) => a.hour.localeCompare(b.hour));
      setHistory(entries.slice(-limit));
    });
    return () => unsub();
  }, [limit]);

  return history;
}
