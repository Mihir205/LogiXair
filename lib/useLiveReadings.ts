"use client";

import { useEffect, useState } from "react";
import { ref, onValue, query, limitToLast } from "firebase/database";
import { db } from "./firebase";

export type HourlyReading = {
  hourKey: string;          // "2026-07-02T13"
  label: string;            // "13:00"
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  wind_direction?: number;
  rainfall?: number;
  pressure?: number;
  irradiance?: number;
};

/**
 * Hourly sensor buckets written by the SmartWeatherAI pipeline to
 * /live_readings/{YYYY-MM-DDTHH} — one clean reading per hour with
 * all 7 Bresser parameters.
 */
export default function useLiveReadings(hours = 48): HourlyReading[] {
  const [readings, setReadings] = useState<HourlyReading[]>([]);

  useEffect(() => {
    const readingsRef = query(ref(db, "live_readings"), limitToLast(hours));

    const unsub = onValue(readingsRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setReadings([]);
        return;
      }
      const rows: HourlyReading[] = Object.entries(data)
        .map(([hourKey, v]: [string, any]) => ({
          hourKey,
          label: `${hourKey.slice(11, 13)}:00`,
          ...v,
        }))
        .sort((a, b) => a.hourKey.localeCompare(b.hourKey));
      setReadings(rows);
    });

    return () => unsub();
  }, [hours]);

  return readings;
}
