"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";
import type { HourlyReading } from "./useLiveReadings";

/**
 * Reads the nested hourly_trend/{date}/{HH:00} store — one reading per hour,
 * aggregated by the pipeline from that hour's samples — and flattens it to a
 * time-ordered array for the analytics "Hourly Trend" chart.
 */
export default function useHourlyTrend(maxPoints = 168): HourlyReading[] {
  const [rows, setRows] = useState<HourlyReading[]>([]);

  useEffect(() => {
    const trendRef = ref(db, "hourly_trend");

    const unsub = onValue(trendRef, (snap) => {
      const tree = snap.val();
      if (!tree) {
        setRows([]);
        return;
      }
      const out: HourlyReading[] = [];
      for (const date of Object.keys(tree)) {
        const hours = tree[date] ?? {};
        for (const hour of Object.keys(hours)) {
          out.push({
            hourKey: `${date} ${hour}`,
            label: hour,
            date,
            ...hours[hour],
          });
        }
      }
      out.sort((a, b) => a.hourKey.localeCompare(b.hourKey));
      setRows(out.slice(-maxPoints));
    });

    return () => unsub();
  }, [maxPoints]);

  return rows;
}
