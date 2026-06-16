"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";

export default function useWeatherData() {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    const weatherRef = ref(db, "weather_station");

    const unsubscribe = onValue(weatherRef, (snapshot) => {
      const data = snapshot.val();

      if (!data?.payload) return;

      setWeather({
        temperature: data.payload.temperature,
        humidity: data.payload.humidity,
        pressure: data.payload.pressure,
        rain: data.payload.rain,
        light: data.payload.light,
        irradiance: data.payload.irradiance,
        wind_direction: data.payload.wind_direction,
        station_id: data.payload.station_id,
        timestamp: data.payload.timestamp,
        receivedAt: data.receivedAt,
        topic: data.topic,
      });
    });

    return () => unsubscribe();
  }, []);

  return weather;
}