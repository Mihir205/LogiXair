"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";

export type WeatherSnapshot = {
  // Identification
  station_id?: string;
  device_id?: string;
  sensor_id?: number;

  // Sensors that Bresser 5-in-1 provides
  temperature?: number;
  humidity?: number;
  rain?: number;
  wind_speed?: number;        // avg wind speed (m/s)
  wind_max_ms?: number;       // gust speed (m/s)
  wind_avg_ms?: number;       // avg speed (m/s) — duplicate alias
  wind_direction?: number;    // degrees

  // Sensors that come from BMP280 + LDR + INA219 (added to ESP32 later — Phase A future)
  pressure?: number;
  light?: number;
  irradiance?: number;

  // Health / metadata
  battery?: string;           // "OK" / "LOW"
  rssi?: number;              // signal strength dBm
  timestamp?: number;
  receivedAt?: number;
  topic?: string;

  // True when the last packet is older than STALE_MS — the station is
  // disconnected. When stale, the sensor readings are blanked so no frozen
  // value is ever shown as live.
  stale?: boolean;
};

// 15 min without a packet ⇒ station disconnected (matches the pipeline's
// STALE_FEED_SECONDS so dashboard and backend agree on "offline").
export const STALE_MS = 15 * 60 * 1000;
const SENSOR_KEYS = [
  "temperature", "humidity", "rain", "wind_speed", "wind_max_ms",
  "wind_avg_ms", "wind_direction", "pressure", "light", "irradiance",
] as const;

/**
 * Reads `weather_station/{payload, receivedAt, topic}` from Firebase RTDB
 * and normalizes the payload — tolerates both legacy field names (rainfall,
 * wind_dir, device_id) and Bresser-native names (rain, wind_direction,
 * station_id). Whichever the publisher sends, the dashboard sees a clean shape.
 */
export default function useWeatherData(): WeatherSnapshot | null {
  const [raw, setRaw] = useState<WeatherSnapshot | null>(null);
  // Re-evaluate staleness every 30s even if no new packet arrives, so a
  // station going offline flips the dashboard to "offline" on its own.
  const [, setTick] = useState(0);

  useEffect(() => {
    const weatherRef = ref(db, "weather_station");
    const unsubscribe = onValue(weatherRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      const p = data.payload ?? data;
      setRaw({
        station_id: p.station_id ?? p.device_id,
        device_id: p.device_id ?? p.station_id,
        sensor_id: p.sensor_id,
        temperature: p.temperature,
        humidity: p.humidity,
        rain: p.rain ?? p.rainfall,
        wind_speed: p.wind_speed ?? p.wind_avg_ms,
        wind_max_ms: p.wind_max_ms,
        wind_avg_ms: p.wind_avg_ms ?? p.wind_speed,
        wind_direction: p.wind_direction ?? p.wind_dir,
        pressure: p.pressure,
        light: p.light,
        irradiance: p.irradiance,
        battery: p.battery,
        rssi: p.rssi,
        timestamp: p.timestamp,
        receivedAt: data.receivedAt,
        topic: data.topic,
      });
    });

    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => {
      unsubscribe();
      clearInterval(id);
    };
  }, []);

  if (!raw) return null;

  const stale =
    typeof raw.receivedAt === "number"
      ? Date.now() - raw.receivedAt > STALE_MS
      : true;

  if (!stale) return { ...raw, stale: false };

  // Disconnected → blank every sensor reading so no frozen value is ever
  // shown as live. Keep identity + last-seen metadata for the health view.
  const blanked: WeatherSnapshot = {
    station_id: raw.station_id,
    device_id: raw.device_id,
    receivedAt: raw.receivedAt,
    rssi: raw.rssi,
    battery: raw.battery,
    topic: raw.topic,
    stale: true,
  };
  for (const k of SENSOR_KEYS) blanked[k] = undefined;
  return blanked;
}
