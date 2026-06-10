"use client";

import { useEffect, useState } from "react";
import { db } from "./firebase";
import { ref, onValue } from "firebase/database";

export default function useAlerts() {
  const [alerts, setAlerts] = useState<any>(null);

  useEffect(() => {
    const alertsRef = ref(db, "alerts");

    const unsubscribe = onValue(alertsRef, (snapshot) => {
      setAlerts(snapshot.val());
    });

    return () => unsubscribe();
  }, []);

  return alerts;
}