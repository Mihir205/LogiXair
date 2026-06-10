"use client";

import { useEffect, useState } from "react";
import { db } from "./firebase";
import { ref, onValue } from "firebase/database";

export default function useAnalyticsData() {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const analyticsRef = ref(db, "analytics");

    const unsubscribe = onValue(
      analyticsRef,
      (snapshot) => {
        const data = snapshot.val();

        console.log("Analytics Loaded:", data);

        setAnalytics(data);
      },
      (error) => {
        console.error("Analytics Error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  return analytics;
}