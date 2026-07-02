"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";

export type HourlyReading = {
  hourKey: string;          // "2026-07-02 14:20"
  label: string;            // "14:20"
  date: string;             // "2026-07-02"
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  wind_direction?: number;
  rainfall?: number;
  pressure?: number;
  irradiance?: number;
};

/**
 * Reads the nested sensor_history/{date}/{time} store written by the
 * SmartWeatherAI pipeline every 20 min, and flattens it to a time-ordered
 * array for the analytics trend chart.
 */
export default function useLiveReadings(maxPoints = 200): HourlyReading[] {
  const [readings, setReadings] = useState<HourlyReading[]>([]);

  useEffect(() => {
    const readingsRef = ref(db, "sensor_history");

    const unsub = onValue(readingsRef, (snap) => {
      const tree = snap.val();
      if (!tree) {
        setReadings([]);
        return;
      }
      const rows: HourlyReading[] = [];
      for (const date of Object.keys(tree)) {
        const times = tree[date] ?? {};
        for (const time of Object.keys(times)) {
          rows.push({
            hourKey: `${date} ${time}`,
            label: time,
            date,
            ...times[time],
          });
        }
      }
      rows.sort((a, b) => a.hourKey.localeCompare(b.hourKey));
      setReadings(rows.slice(-maxPoints));
    });

    return () => unsub();
  }, [maxPoints]);

  return readings;
}
