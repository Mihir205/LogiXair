"use client";

import { useEffect, useState } from "react";
import useWeatherData from "./useWeatherData";

export type HealthLevel = "good" | "warn" | "bad" | "unknown";

export type DeviceHealth = {
  stationId: string;
  online: boolean;
  lastSeenSec: number | null;      // seconds since last packet
  battery: { label: string; level: HealthLevel };
  signal: { label: string; dbm: number | null; level: HealthLevel };
  solar: { label: string; amps: number | null; level: HealthLevel };
  link: { label: string; level: HealthLevel };
};

const STALE_SEC = 20 * 60; // 20 min without a packet ⇒ offline

function signalLevel(dbm: number | null): { label: string; level: HealthLevel } {
  if (dbm == null) return { label: "Unknown", level: "unknown" };
  if (dbm >= -70) return { label: "Strong", level: "good" };
  if (dbm >= -85) return { label: "Good", level: "good" };
  if (dbm >= -100) return { label: "Weak", level: "warn" };
  return { label: "Very weak", level: "bad" };
}

export default function useDeviceHealth(): DeviceHealth | null {
  const w = useWeatherData();
  // Re-evaluate staleness every 15s even if no new packet arrives.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  if (!w) return null;

  const lastSeenSec =
    typeof w.receivedAt === "number"
      ? Math.max(0, Math.round((Date.now() - w.receivedAt) / 1000))
      : null;
  const online = lastSeenSec != null && lastSeenSec < STALE_SEC;

  const batteryRaw = (w.battery ?? "").toString().toUpperCase();
  const battery =
    batteryRaw === "OK"
      ? { label: "OK", level: "good" as HealthLevel }
      : batteryRaw === "LOW"
        ? { label: "Low", level: "bad" as HealthLevel }
        : { label: batteryRaw || "Unknown", level: "unknown" as HealthLevel };

  const dbm = typeof w.rssi === "number" ? w.rssi : null;
  const sig = signalLevel(dbm);

  const amps = typeof (w as any).panel_current_a === "number" ? (w as any).panel_current_a : null;
  const solar =
    amps == null
      ? { label: "No sensor", amps: null, level: "unknown" as HealthLevel }
      : amps > 0.05
        ? { label: `${amps.toFixed(2)} A charging`, amps, level: "good" as HealthLevel }
        : { label: "Idle / dark", amps, level: "warn" as HealthLevel };

  const link: { label: string; level: HealthLevel } = online
    ? { label: "Primary link live", level: "good" }
    : { label: "No telemetry — check power/gateway", level: "bad" };

  return {
    stationId: w.station_id ?? w.device_id ?? "unknown",
    online,
    lastSeenSec,
    battery,
    signal: { ...sig, dbm },
    solar,
    link,
  };
}
