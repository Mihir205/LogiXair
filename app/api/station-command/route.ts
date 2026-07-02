import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminApp, adminFirestore, adminDatabase } from "../../../lib/firebaseAdmin";

/**
 * POST /api/station-command
 * Body: { command: "restart" | "sync" }
 * Auth: Firebase ID token; caller must be operator or admin.
 *
 * Records an auditable command request under RTDB /station/commands. There is
 * no field-gateway command consumer yet, so this QUEUES + LOGS the request
 * (with who/when) rather than executing it — honest and forward-compatible:
 * when the gateway command channel is added it drains this queue.
 */
const ALLOWED = new Set(["restart", "sync"]);

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Missing auth token" }, { status: 401 });

    let decoded;
    try {
      decoded = await getAuth(adminApp).verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const roleDoc = await adminFirestore.collection("users").doc(decoded.uid).get();
    const role = roleDoc.exists ? roleDoc.data()?.role : null;
    if (role !== "operator" && role !== "admin") {
      return NextResponse.json({ error: "Operator or admin role required" }, { status: 403 });
    }

    const body = await req.json();
    const command = String(body?.command ?? "");
    if (!ALLOWED.has(command)) {
      return NextResponse.json({ error: "Unknown command" }, { status: 400 });
    }

    await adminDatabase.ref("station/commands").push({
      command,
      status: "queued",
      requested_by: decoded.uid,
      requested_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, queued: command });
  } catch {
    return NextResponse.json({ error: "Could not queue command" }, { status: 500 });
  }
}
