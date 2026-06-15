import { NextResponse } from "next/server";
import { adminDatabase } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const stationId =
      body.stationId || "station_001";

    await adminDatabase
      .ref(`weather/${stationId}`)
      .set({
        temperature: body.temperature,
        humidity: body.humidity,
        pressure: body.pressure,
        rain: body.rain,
        light: body.light,
        wind_direction: body.wind_direction,
        irradiance: body.irradiance,
        timestamp: body.timestamp,
        lastUpdated: Date.now(),
      });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed",
      },
      {
        status: 500,
      }
    );
  }
}