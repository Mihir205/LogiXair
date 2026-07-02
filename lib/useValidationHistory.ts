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
 * Builds the actual-vs-predicted ledger by JOINING two nested stores:
 *   predictions_all_models/{date}/{time}  — the 4-model forecast made ~1h
 *                                            earlier, keyed to the slot it targets
 *   sensor_history/{date}/{time}          — the reading that actually arrived
 *
 * A validation row exists for every target slot that has BOTH a forecast and
 * a matching actual. Computing this client-side (rather than relying on the
 * pipeline to write a separate validation_history node at the exact moment)
 * means the ledger fills as soon as the data exists — robust to intermittent
 * pipeline runs. Falls back to the pipeline's validation_history if present.
 */
export default function useValidationHistory(limit = 100): ValidationEntry[] {
  const [preds, setPreds] = useState<any>(null);
  const [actuals, setActuals] = useState<any>(null);
  const [written, setWritten] = useState<any>(null);
  const [predHist, setPredHist] = useState<any>(null);

  useEffect(() => {
    const offP = onValue(ref(db, "predictions_all_models"), (s) => setPreds(s.val()));
    const offA = onValue(ref(db, "sensor_history"), (s) => setActuals(s.val()));
    const offW = onValue(ref(db, "validation_history"), (s) => setWritten(s.val()));
    const offH = onValue(ref(db, "prediction_history"), (s) => setPredHist(s.val()));
    return () => { offP(); offA(); offW(); offH(); };
  }, []);

  const entries: ValidationEntry[] = [];

  // 1. Prefer any records the pipeline already wrote (nested date/time).
  if (written) {
    for (const date of Object.keys(written)) {
      const times = written[date] ?? {};
      for (const time of Object.keys(times)) {
        const rec = times[time];
        if (rec?.actual && rec?.predictions) {
          entries.push({ hour: rec.hour ?? `${date} ${time}`, actual: rec.actual, predictions: rec.predictions });
        }
      }
    }
  }

  // 2. Also join forecasts with the actuals that arrived at their target slot.
  const seen = new Set(entries.map((e) => e.hour));
  if (preds && actuals) {
    for (const date of Object.keys(preds)) {
      const slots = preds[date] ?? {};
      for (const time of Object.keys(slots)) {
        const key = `${date} ${time}`;
        if (seen.has(key)) continue;
        const forecast = slots[time]?.predictions;
        const actual = actuals[date]?.[time];
        if (forecast && actual) {
          entries.push({ hour: key, actual, predictions: forecast });
          seen.add(key);
        }
      }
    }
  }

  // 3. Fallback so the ledger is never blank while true validation builds:
  //    prediction_history has {actual, predicted(best model)} per slot, keyed
  //    date/time — surfaced as a single "Forecast" model until the 4-model
  //    validation records accumulate.
  if (entries.length === 0 && predHist) {
    for (const date of Object.keys(predHist)) {
      const times = predHist[date] ?? {};
      for (const time of Object.keys(times)) {
        const rec = times[time];
        if (rec?.actual && rec?.predicted) {
          entries.push({
            hour: `${date} ${time}`,
            actual: rec.actual,
            predictions: { Forecast: rec.predicted },
          });
        }
      }
    }
  }

  entries.sort((a, b) => a.hour.localeCompare(b.hour));
  return entries.slice(-limit);
}
