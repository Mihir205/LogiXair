"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";

export type ModelSample = { actual: number; predicted: number };

export type ModelMetric = {
  train_r2: number;
  test_r2: number;
  mae: number;
  mse: number;
  rmse: number;
  samples?: { train: ModelSample[]; test: ModelSample[] };
};

export type ModelMetricsMap = {
  models: Record<string, ModelMetric>;
  best: string | null;
  updatedAt: string | null;
};

export default function useModelMetrics(): ModelMetricsMap | null {
  const [metrics, setMetrics] = useState<ModelMetricsMap | null>(null);

  useEffect(() => {
    const metricsRef = ref(db, "model_metrics");

    const unsub = onValue(metricsRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setMetrics(null);
        return;
      }

      const models: Record<string, ModelMetric> = {};
      let best: string | null = null;
      let updatedAt: string | null = null;

      for (const key of Object.keys(data)) {
        if (key === "_best") {
          best = data[key];
        } else if (key === "_updated_at") {
          updatedAt = data[key];
        } else {
          models[key] = data[key];
        }
      }

      setMetrics({ models, best, updatedAt });
    });

    return () => unsub();
  }, []);

  return metrics;
}
