/**
 * requireAdmin — server-side guard for Next.js API routes.
 *
 * Verifies the caller's Firebase ID token, then checks that their Firestore
 * user document has role === "admin". Use this at the top of any route that
 * performs privileged operations (user creation, role changes, station
 * registration, etc.).
 *
 * Usage:
 *   export async function POST(req: Request) {
 *     const guard = await requireAdmin(req);
 *     if ("error" in guard) return guard.error;
 *     const { caller } = guard;          // { uid, email, role }
 *     // ... privileged work here ...
 *   }
 *
 * Why this exists: without it, our API routes are reachable by anyone on
 * the internet — see attacks/01_create_admin_unauthenticated for the demo.
 */
import { NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "@/lib/firebaseAdmin";

export type AdminCaller = {
    uid: string;
    email: string | undefined;
    role: "admin";
};

export type GuardResult =
    | { caller: AdminCaller }
    | { error: ReturnType<typeof NextResponse.json> };

export async function requireAdmin(req: Request): Promise<GuardResult> {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
        return {
            error: NextResponse.json(
                { success: false, error: "Missing or malformed Authorization header" },
                { status: 401 },
            ),
        };
    }

    const idToken = authHeader.slice(7).trim();
    if (!idToken) {
        return {
            error: NextResponse.json(
                { success: false, error: "Empty bearer token" },
                { status: 401 },
            ),
        };
    }

    let decoded;
    try {
        // checkRevoked=true ensures revoked tokens (signOut, password change)
        // are rejected even within the 1-hour ID-token lifetime.
        decoded = await adminAuth.verifyIdToken(idToken, true);
    } catch {
        return {
            error: NextResponse.json(
                { success: false, error: "Invalid or expired token" },
                { status: 401 },
            ),
        };
    }

    let role: string | undefined;
    try {
        const snap = await adminFirestore.collection("users").doc(decoded.uid).get();
        role = snap.exists ? (snap.data() as { role?: string }).role : undefined;
    } catch {
        return {
            error: NextResponse.json(
                { success: false, error: "Could not verify caller role" },
                { status: 500 },
            ),
        };
    }

    if (role !== "admin") {
        return {
            error: NextResponse.json(
                { success: false, error: "Admin role required" },
                { status: 403 },
            ),
        };
    }

    return {
        caller: { uid: decoded.uid, email: decoded.email, role: "admin" },
    };
}
