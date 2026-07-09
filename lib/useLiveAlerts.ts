"use client";

import { useMemo } from "react";
import useAlerts from "./useAlerts";
import useWeatherData from "./useWeatherData";
import useAnomalies from "./useAnomalies";

export type LiveAlert = {
  id: string;
  message: string;
  type: "critical" | "warning" | "info";
  source: "system" | "threshold";
  timestamp?: string | number;
  status: boolean;
};

// Environmental + hardware thresholds for an off-grid station.
const THRESHOLDS = {
  tempHigh: 45,      // °C
  tempLow: -5,       // °C
  humidityHigh: 95,  // %
  windGust: 15,      // m/s ≈ 54 km/h
  rainHeavy: 20,     // mm
  pressureLow: 870,  // hPa (storm territory at altitude)
  rssiWeak: -100,    // dBm
  staleAfterMin: 20, // minutes without a fresh packet
};

/**
 * Merges the persisted /alerts node with alerts derived LIVE from the
 * current Bresser payload — battery, signal, staleness, and weather
 * threshold violations. Purely client-side: recomputes on every packet.
 */
export default function useLiveAlerts(): {
  alerts: LiveAlert[];
  activeCount: number;
} {
  const stored = useAlerts();
  const w = useWeatherData();
  const { anomalies } = useAnomalies();

  const derived = useMemo<LiveAlert[]>(() => {
    if (!w) return [];
    const out: LiveAlert[] = [];
    const now = Date.now();

    const push = (id: string, message: string, type: LiveAlert["type"]) =>
      out.push({ id, message, type, source: "threshold", timestamp: now, status: true });

    // ---- Station connectivity ----
    // When disconnected, raise ONE offline alert and skip all the weather
    // threshold checks (their inputs are blanked, so they'd be false anyway —
    // this also guarantees we never alert on frozen/stale values).
    if (w.stale) {
      const mins = typeof w.receivedAt === "number"
        ? Math.round((now - w.receivedAt) / 60000)
        : null;
      push("offline", `Station disconnected — no telemetry${mins != null ? ` for ${mins} min` : ""}. Data collection paused.`, "critical");
      return out;
    }

    // ---- Hardware health ----
    if (w.battery && w.battery !== "OK") {
      push("battery", `Station battery is ${w.battery} — schedule a field visit`, "critical");
    }
    if (typeof w.rssi === "number" && w.rssi < THRESHOLDS.rssiWeak) {
      push("rssi", `Weak radio link (${w.rssi} dBm) — packets may drop`, "warning");
    }
    if (typeof w.receivedAt === "number") {
      const ageMin = (now - w.receivedAt) / 60000;
      if (ageMin > THRESHOLDS.staleAfterMin) {
        push(
          "stale",
          `No telemetry for ${Math.round(ageMin)} min — check station power / gateway`,
          "critical"
        );
      }
    }

    // ---- Environmental thresholds ----
    if (typeof w.temperature === "number") {
      if (w.temperature >= THRESHOLDS.tempHigh)
        push("temp-high", `Extreme heat: ${w.temperature.toFixed(1)}°C`, "critical");
      else if (w.temperature <= THRESHOLDS.tempLow)
        push("temp-low", `Freezing conditions: ${w.temperature.toFixed(1)}°C`, "warning");
    }
    if (typeof w.humidity === "number" && w.humidity >= THRESHOLDS.humidityHigh) {
      push("humidity", `Saturated air (${w.humidity.toFixed(0)}%) — condensation risk on electronics`, "warning");
    }
    const gust = w.wind_max_ms ?? w.wind_speed;
    if (typeof gust === "number" && gust >= THRESHOLDS.windGust) {
      push("wind", `High wind: ${gust.toFixed(1)} m/s gusts — check mast anchoring`, "critical");
    }
    if (typeof w.rain === "number" && w.rain >= THRESHOLDS.rainHeavy) {
      push("rain", `Heavy rainfall: ${w.rain.toFixed(1)} mm`, "warning");
    }
    if (typeof w.pressure === "number" && w.pressure > 0 && w.pressure <= THRESHOLDS.pressureLow) {
      push("pressure", `Pressure falling sharply (${w.pressure.toFixed(0)} hPa) — storm system possible`, "warning");
    }

    return out;
  }, [w]);

  // Statistical anomalies become alerts too (severe → critical).
  const anomalyList: LiveAlert[] = useMemo(
    () =>
      anomalies.map((a) => ({
        id: `anomaly-${a.parameter}`,
        message: `${a.label} anomaly: ${a.value}${a.unit} (${Math.abs(a.z)}σ ${a.direction} vs baseline ≈ ${a.mean}${a.unit})`,
        type: a.severity === "severe" ? ("critical" as const) : ("warning" as const),
        source: "threshold" as const,
        timestamp: Date.now(),
        status: true,
      })),
    [anomalies],
  );

  const storedList: LiveAlert[] = stored
    ? Object.entries(stored)
        .filter(([, a]: [string, any]) => a?.status)
        .map(([id, a]: [string, any]) => ({
          id,
          message: a.message ?? String(id),
          type: (a.type as LiveAlert["type"]) ?? "info",
          source: "system" as const,
          timestamp: a.timestamp,
          status: true,
        }))
    : [];

  const alerts = [...derived, ...anomalyList, ...storedList];
  return { alerts, activeCount: alerts.length };
}
