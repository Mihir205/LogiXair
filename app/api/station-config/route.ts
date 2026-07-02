import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminApp, adminFirestore, adminDatabase } from "../../../lib/firebaseAdmin";

/**
 * POST /api/station-config
 * Body: { latitude: number, longitude: number, place: string }
 * Auth: Firebase ID token in Authorization: Bearer <token>.
 * Only users whose Firestore users/{uid}.role is operator or admin may write.
 * Writing /station/config makes the SmartWeatherAI service retrain against
 * NASA POWER data for the new coordinates within one poll interval.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await getAuth(adminApp).verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const userDoc = await adminFirestore.collection("users").doc(decoded.uid).get();
    const role = userDoc.exists ? userDoc.data()?.role : null;
    if (role !== "operator" && role !== "admin") {
      return NextResponse.json(
        { error: "Only operators and admins can change the station location" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);
    const place = String(body?.place ?? "").slice(0, 120).trim();

    if (
      Number.isNaN(latitude) || Number.isNaN(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180
    ) {
      return NextResponse.json({ error: "Coordinates out of range" }, { status: 400 });
    }

    await adminDatabase.ref("station/config").set({
      latitude,
      longitude,
      place: place || `${latitude.toFixed(4)},${longitude.toFixed(4)}`,
      updated_by: decoded.uid,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("station-config error:", e?.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
