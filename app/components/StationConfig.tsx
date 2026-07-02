"use client";

import { useState, useEffect } from "react";
import { MapPin, Search, Crosshair, CheckCircle2, Loader2, Cog, AlertTriangle } from "lucide-react";
import { useStationConfig, updateStationConfig, usePipelineStatus } from "../../lib/useStationConfig";

const STATUS_UI: Record<string, { label: string; cls: string; spin?: boolean }> = {
  idle:           { label: "Pipeline idle",        cls: "text-slate-500 dark:text-slate-400" },
  training:       { label: "Training on NASA data…", cls: "text-indigo-600 dark:text-indigo-400", spin: true },
  running:        { label: "Prediction cycle running…", cls: "text-emerald-600 dark:text-emerald-400", spin: true },
  no_sensor_data: { label: "Bresser feed silent",   cls: "text-amber-600 dark:text-amber-400" },
  error:          { label: "Pipeline error",        cls: "text-rose-600 dark:text-rose-400" },
};

export default function StationConfig() {
  const current = useStationConfig();
  const pipeline = usePipelineStatus();
  const [place, setPlace] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (current && !place && !lat && !lon) {
      setPlace(current.place ?? "");
      setLat(String(current.latitude));
      setLon(String(current.longitude));
    }
  }, [current, place, lat, lon]);

  const geocode = async () => {
    if (!place.trim()) return;
    setStatus("searching");
    setError("");
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(place.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 404
            ? "Location not found. Try a more specific place name."
            : data?.error ?? "Geocoding failed."
        );
        setStatus("error");
        return;
      }
      setLat(data.latitude.toFixed(4));
      setLon(data.longitude.toFixed(4));
      setPlace(data.name);
      setStatus("idle");
    } catch {
      setError("Geocoding failed. Check your connection.");
      setStatus("error");
    }
  };

  // Reverse-geocode manually typed coordinates → auto-fill the place name
  const resolvePlaceFromCoords = async () => {
    const nlat = Number(lat);
    const nlon = Number(lon);
    if (Number.isNaN(nlat) || Number.isNaN(nlon)) return;
    if (nlat < -90 || nlat > 90 || nlon < -180 || nlon > 180) return;
    // Skip if coords haven't actually changed from the saved config
    if (
      current &&
      Math.abs(nlat - current.latitude) < 1e-4 &&
      Math.abs(nlon - current.longitude) < 1e-4
    )
      return;

    setStatus("searching");
    setError("");
    try {
      const res = await fetch(`/api/geocode?lat=${nlat}&lon=${nlon}`);
      const data = await res.json();
      if (res.ok && data?.name) {
        setPlace(data.name);
      }
      setStatus("idle");
    } catch {
      // Geocoding failure shouldn't block saving — coords are what matter
      setStatus("idle");
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported in this browser.");
      setStatus("error");
      return;
    }
    setStatus("searching");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
        try {
          const res = await fetch(
            `/api/geocode?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const data = await res.json();
          if (res.ok && data?.name) setPlace(data.name);
        } catch {}
        setStatus("idle");
      },
      () => {
        setError("Location permission denied.");
        setStatus("error");
      }
    );
  };

  const save = async () => {
    const nlat = Number(lat);
    const nlon = Number(lon);
    if (Number.isNaN(nlat) || Number.isNaN(nlon)) {
      setError("Enter valid numeric latitude and longitude.");
      setStatus("error");
      return;
    }
    if (nlat < -90 || nlat > 90 || nlon < -180 || nlon > 180) {
      setError("Coordinates out of range.");
      setStatus("error");
      return;
    }
    setStatus("saving");
    try {
      // If no place name yet, resolve one from the coords so the dashboard
      // always shows what location the model is connected to.
      let placeName = place.trim();
      if (!placeName) {
        try {
          const res = await fetch(`/api/geocode?lat=${nlat}&lon=${nlon}`);
          const data = await res.json();
          if (res.ok && data?.name) {
            placeName = data.name;
            setPlace(placeName);
          }
        } catch {}
      }
      await updateStationConfig({ latitude: nlat, longitude: nlon, place: placeName || `${nlat.toFixed(4)},${nlon.toFixed(4)}` });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (e: any) {
      setError(e?.message ?? "Save failed.");
      setStatus("error");
    }
  };

  // Enabled when coords are valid numbers AND differ from the saved config.
  // If we can't read the saved config at all (null), allow saving — the
  // server-side route still validates everything.
  const coordsValid =
    lat.trim() !== "" && lon.trim() !== "" &&
    !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lon));

  const dirty =
    coordsValid &&
    (!current ||
      Number(lat).toFixed(4) !== current.latitude.toFixed(4) ||
      Number(lon).toFixed(4) !== current.longitude.toFixed(4) ||
      place !== current.place);

  return (
    <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-6 md:p-7 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} className="text-indigo-500" />
              <span className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
                Station Location
              </span>
            </div>
            <h3 className="font-editorial text-2xl font-light tracking-tight text-slate-900 dark:text-white">
              Where should we train?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-editorial italic mt-1">
              Enter a place, coordinates, or use your device location. The pipeline retrains against NASA data for the new site.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && geocode()}
                placeholder="e.g. Bengaluru, IN"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={geocode}
              disabled={!place.trim() || status === "searching"}
              className="px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold tracking-wide uppercase hover:opacity-90 disabled:opacity-40 transition inline-flex items-center gap-1.5"
            >
              {status === "searching" ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              Search
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-[1fr_1fr_auto] gap-2">
            <div>
              <label className="font-mono-data text-[9px] tracking-widest uppercase text-slate-400">Latitude</label>
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                onBlur={resolvePlaceFromCoords}
                className="mt-1 w-full px-3 py-2 text-sm font-mono-data rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                placeholder="12.9716"
              />
            </div>
            <div>
              <label className="font-mono-data text-[9px] tracking-widest uppercase text-slate-400">Longitude</label>
              <input
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                onBlur={resolvePlaceFromCoords}
                className="mt-1 w-full px-3 py-2 text-sm font-mono-data rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                placeholder="77.5946"
              />
            </div>
            <button
              onClick={useMyLocation}
              className="mt-5 md:mt-0 self-end px-3 py-2 rounded-lg text-xs font-mono-data tracking-wide uppercase text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 inline-flex items-center gap-1.5"
              title="Use my location"
            >
              <Crosshair size={13} /> me
            </button>
          </div>

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-editorial italic">{error}</p>
          )}
        </div>

        <div className="flex flex-col items-stretch lg:items-end gap-3 lg:min-w-[220px]">
          {current && (
            <div className="text-right">
              <p className="font-mono-data text-[10px] tracking-widest uppercase text-slate-400">Currently trained on</p>
              <p className="font-editorial text-lg font-light text-slate-900 dark:text-white leading-tight">
                {current.place || "—"}
              </p>
              <p className="font-mono-data text-xs text-slate-500 mt-0.5">
                {current.latitude.toFixed(4)}°, {current.longitude.toFixed(4)}°
              </p>
            </div>
          )}
          {pipeline && STATUS_UI[pipeline.state] && (
            <div className={"inline-flex items-center gap-1.5 justify-end font-mono-data text-[10px] tracking-widest uppercase " + STATUS_UI[pipeline.state].cls}>
              {pipeline.state === "error" || pipeline.state === "no_sensor_data"
                ? <AlertTriangle size={12} />
                : <Cog size={12} className={STATUS_UI[pipeline.state].spin ? "animate-spin" : ""} />}
              {STATUS_UI[pipeline.state].label}
            </div>
          )}
          <button
            onClick={save}
            disabled={!dirty || status === "saving"}
            className={
              "px-6 py-3 rounded-lg text-sm font-semibold tracking-wide transition inline-flex items-center justify-center gap-2 " +
              (dirty
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : status === "saved"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed")
            }
          >
            {status === "saving" && <Loader2 size={14} className="animate-spin" />}
            {status === "saved" && <CheckCircle2 size={14} />}
            {status === "saved" ? "Saved — retraining next cycle" : "Save & Retrain"}
          </button>
        </div>
      </div>
    </div>
  );
}
