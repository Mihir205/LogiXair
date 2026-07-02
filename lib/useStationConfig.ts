"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db, auth } from "./firebase";

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

export type PipelineStatus = {
  state: "idle" | "training" | "running" | "no_sensor_data" | "error";
  updated_at?: string;
  place?: string;
};

export function usePipelineStatus(): PipelineStatus | null {
  const [status, setStatus] = useState<PipelineStatus | null>(null);

  useEffect(() => {
    const statusRef = ref(db, "station/status");
    const unsub = onValue(statusRef, (snap) => {
      setStatus(snap.val() ?? null);
    });
    return () => unsub();
  }, []);

  return status;
}

export async function updateStationConfig(cfg: StationConfig): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();

  const res = await fetch("/api/station-config", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(cfg),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? `Save failed (${res.status})`);
  }
}
