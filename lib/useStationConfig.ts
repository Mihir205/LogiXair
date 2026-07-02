"use client";

import { useEffect, useState } from "react";
import { ref, onValue, set as fbSet } from "firebase/database";
import { db } from "./firebase";

export type StationConfig = {
  latitude: number;
  longitude: number;
  place: string;
};

export function useStationConfig(): StationConfig | null {
  const [config, setConfig] = useState<StationConfig | null>(null);

  useEffect(() => {
    const cfgRef = ref(db, "station/config");
    const unsub = onValue(cfgRef, (snap) => {
      const v = snap.val();
      if (!v) return setConfig(null);
      setConfig({
        latitude: Number(v.latitude ?? 0),
        longitude: Number(v.longitude ?? 0),
        place: String(v.place ?? ""),
      });
    });
    return () => unsub();
  }, []);

  return config;
}

export async function updateStationConfig(cfg: StationConfig): Promise<void> {
  await fbSet(ref(db, "station/config"), cfg);
}
