import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAuth";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/security/requireAdmin";

// FLIP FOR THE BEFORE / AFTER CYBERATTACK #5 SCREENSHOTS.
const ADMIN_CREATE_GUARD_ENABLED = true;

export async function POST(req: Request) {
  if (ADMIN_CREATE_GUARD_ENABLED) {
    const guard = await requireAdmin(req);
    if ("error" in guard) return guard.error;
  }

  try {
    const body = await req.json();

    const {
      email,
      password,
      role,
      stations,
    } = body;

    const user = await adminAuth.createUser({
      email,
      password,
    });

    await adminFirestore
      .collection("users")
      .doc(user.uid)
      .set({
        uid: user.uid,
        email,
        role,
        stations,
        active: true,
        createdAt: new Date(),
      });

    return NextResponse.json({
      success: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}