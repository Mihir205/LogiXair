import { NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    await adminFirestore
      .collection("weather")
      .add({
        ...data,
        timestamp: new Date(),
      });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}