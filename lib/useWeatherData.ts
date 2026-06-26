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
};

/**
 * Reads `weather_station/{payload, receivedAt, topic}` from Firebase RTDB
 * and normalizes the payload — tolerates both legacy field names (rainfall,
 * wind_dir, device_id) and Bresser-native names (rain, wind_direction,
 * station_id). Whichever the publisher sends, the dashboard sees a clean shape.
 */
export default function useWeatherData(): WeatherSnapshot | null {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);

  useEffect(() => {
    const weatherRef = ref(db, "weather_station");

    const unsubscribe = onValue(weatherRef, (snapshot) => {
      const data = snapshot.val();
      if (!data?.payload) return;
      const p = data.payload;

      setWeather({
        station_id: p.station_id ?? p.device_id,
        device_id: p.device_id ?? p.station_id,
        sensor_id: p.sensor_id,

        temperature: p.temperature,
        humidity: p.humidity,
        rain: p.rain ?? p.rainfall,                    // accept either name
        wind_speed: p.wind_speed ?? p.wind_avg_ms,
        wind_max_ms: p.wind_max_ms,
        wind_avg_ms: p.wind_avg_ms ?? p.wind_speed,
        wind_direction: p.wind_direction ?? p.wind_dir,

        pressure: p.pressure,                           // undefined until BMP280 added
        light: p.light,                                 // undefined until LDR added
        irradiance: p.irradiance,                       // undefined until INA219 added

        battery: p.battery,
        rssi: p.rssi,
        timestamp: p.timestamp,
        receivedAt: data.receivedAt,
        topic: data.topic,
      });
    });

    return () => unsubscribe();
  }, []);

  return weather;
}
