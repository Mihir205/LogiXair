import { NextResponse } from "next/server";
import {
  adminFirestore,
  adminDatabase,
} from "@/lib/firebaseAdmin";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Webhook alive",
  });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // -----------------------------
    // 1. Update Realtime Database
    // -----------------------------
    await adminDatabase.ref("weather_station").set({
      ...payload,
      receivedAt: Date.now(),
    });

    // -----------------------------
    // 2. Save to Firestore every 20 min
    // -----------------------------
    const now = Date.now();

    const metaRef = adminFirestore
      .collection("system")
      .doc("weather");

    const metaDoc = await metaRef.get();

    const lastSaved =
      metaDoc.exists
        ? metaDoc.data()?.lastSaved || 0
        : 0;

    if (now - lastSaved >= 20 * 60 * 1000) {
      await adminFirestore
        .collection("readings")
        .add({
          ...payload,
          receivedAt: new Date(),
        });

      await metaRef.set({
        lastSaved: now,
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("EMQX Webhook Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}