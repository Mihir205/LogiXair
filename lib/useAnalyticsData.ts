"use client";

import { useEffect, useState } from "react";
import { db } from "./firebase";
import { ref, onValue } from "firebase/database";

/**
 * Subscribes to the three RTDB nodes the analytics page needs.
 * Targeted paths (not the DB root) so security rules can deny
 * root reads while each node stays individually readable.
 */
export default function useAnalyticsData() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [weatherStation, setWeatherStation] = useState<any>(null);
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);

  useEffect(() => {
    const offAnalytics = onValue(
      ref(db, "analytics"),
      (snap) => {
        setAnalytics(snap.val() ?? {});
        setAnalyticsLoaded(true);
      },
      (error) => console.error(error)
    );
    const offPrediction = onValue(
      ref(db, "prediction"),
      (snap) => setPrediction(snap.val() ?? null),
      (error) => console.error(error)
    );
    const offStation = onValue(
      ref(db, "weather_station"),
      (snap) => setWeatherStation(snap.val() ?? null),
      (error) => console.error(error)
    );

    return () => {
      offAnalytics();
      offPrediction();
      offStation();
    };
  }, []);

  if (!analyticsLoaded) return null;

  return {
    ...(analytics ?? {}),
    prediction,
    weather_station: weatherStation,
  };
}
