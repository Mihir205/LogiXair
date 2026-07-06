"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";

export type PlaceInfo = {
  key: string;
  place: string;
  latitude: number;
  longitude: number;
  last_seen?: string;
};

/**
 * Reads the /places registry — every location the pipeline has ever collected
 * data for (keyed by rounded coordinates). Used by the CSV export to pick a
 * place, and to name the exported files.
 */
export default function usePlaces(): PlaceInfo[] {
  const [places, setPlaces] = useState<PlaceInfo[]>([]);

  useEffect(() => {
    const unsub = onValue(ref(db, "places"), (snap) => {
      const data = snap.val() ?? {};
      const list: PlaceInfo[] = Object.entries(data).map(([key, v]: [string, any]) => ({
        key,
        place: v.place ?? key,
        latitude: v.latitude,
        longitude: v.longitude,
        last_seen: v.last_seen,
      }));
      list.sort((a, b) => (b.last_seen ?? "").localeCompare(a.last_seen ?? ""));
      setPlaces(list);
    });
    return () => unsub();
  }, []);

  return places;
}
