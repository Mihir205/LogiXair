import { NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Webhook alive",
  });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const docRef = await adminFirestore
      .collection("weather")
      .add({
        ...data,
        receivedAt: new Date(),
      });

    return NextResponse.json({
      success: true,
      id: docRef.id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}