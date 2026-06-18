"use client";

import { useEffect, useState } from "react";
import { db } from "./firebase";
import { ref, onValue } from "firebase/database";

export default function useAnalyticsData() {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const analyticsRef = ref(db, "/");

    const unsubscribe = onValue(
      analyticsRef,
      (snapshot) => {
        const data = snapshot.val();

        setAnalytics({
          ...data.analytics,
          prediction: data.prediction,
          weather_station: data.weather_station,
        });
      },
      (error) => {
        console.error(error);
      }
    );

    return () => unsubscribe();
  }, []);

  return analytics;
}