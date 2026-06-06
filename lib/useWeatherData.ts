"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";

export default function useWeatherData() {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    const weatherRef = ref(db, "weather_station");

    const unsubscribe = onValue(
      weatherRef,
      (snapshot) => {
        setWeather(snapshot.val());
      }
    );

    return () => unsubscribe();
  }, []);

  return weather;
}