import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geocode?q=Delhi            → forward geocode (place → coords)
 * GET /api/geocode?lat=28.6&lon=77.2  → reverse geocode (coords → place)
 *
 * Server-side proxy for Nominatim so the browser never calls it directly
 * (Nominatim rejects/rate-limits raw browser requests). Sends the proper
 * User-Agent per the usage policy and caches results for an hour.
 */

const HEADERS = {
  "User-Agent": "LogiXair-WeatherPlatform/1.0 (station-config geocoding)",
  "Accept-Language": "en",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  try {
    if (q && q.trim()) {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q.trim())}&format=json&limit=1`;
      const res = await fetch(url, { headers: HEADERS, next: { revalidate: 3600 } });
      if (!res.ok) {
        return NextResponse.json({ error: `Geocoder returned ${res.status}` }, { status: 502 });
      }
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        return NextResponse.json({ error: "Location not found" }, { status: 404 });
      }
      return NextResponse.json({
        latitude: Number(data[0].lat),
        longitude: Number(data[0].lon),
        name: String(data[0].display_name ?? "").split(",").slice(0, 2).join(",").trim(),
      });
    }

    if (lat != null && lon != null) {
      const nlat = Number(lat);
      const nlon = Number(lon);
      if (
        Number.isNaN(nlat) || Number.isNaN(nlon) ||
        nlat < -90 || nlat > 90 || nlon < -180 || nlon > 180
      ) {
        return NextResponse.json({ error: "Coordinates out of range" }, { status: 400 });
      }
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${nlat}&lon=${nlon}&format=json&zoom=10`;
      const res = await fetch(url, { headers: HEADERS, next: { revalidate: 3600 } });
      if (!res.ok) {
        return NextResponse.json({ error: `Geocoder returned ${res.status}` }, { status: 502 });
      }
      const data = await res.json();
      const name = data?.display_name
        ? String(data.display_name).split(",").slice(0, 2).join(",").trim()
        : `Unnamed area (${nlat.toFixed(2)}°, ${nlon.toFixed(2)}°)`;
      return NextResponse.json({ latitude: nlat, longitude: nlon, name });
    }

    return NextResponse.json({ error: "Provide ?q= or ?lat=&lon=" }, { status: 400 });
  } catch (e: any) {
    console.error("geocode proxy error:", e?.message);
    return NextResponse.json({ error: "Geocoding service unreachable" }, { status: 502 });
  }
}
