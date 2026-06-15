import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Webhook alive",
  });
}

export async function POST(req: Request) {
  const data = await req.json();

  return NextResponse.json({
    success: true,
    data,
  });
}