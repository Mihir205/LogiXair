/**
 * Internal attack-runner for the in-dashboard Cybersecurity Demos page.
 *
 * Each attack:
 *   1. Calls the target endpoint server-side as an anonymous request.
 *   2. Captures the response.
 *   3. If the attack exploited the system (e.g. created a rogue admin),
 *      automatically cleans up — deletes the Firebase Auth user and
 *      the Firestore users/{uid} doc — so the project isn't polluted
 *      after the demo.
 *   4. Writes a security_events record so the alerts feed picks it up.
 *
 * The dashboard subscribes to `security_events` in real time to display
 * the alert as it lands.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/requireAdmin";
import { adminAuth } from "@/lib/firebaseAuth";
import { adminFirestore } from "@/lib/firebaseAdmin";import { logSecurityEvent } from "@/lib/security/logSecurityEvent";

type AttackResult = {
    id: string;
    name: string;
    description: string;
    target: string;
    method: string;
    requestBody?: unknown;
    httpStatus: number;
    responseBody: unknown;
    classification: "exploited" | "blocked" | "error";
    summary: string;
    durationMs: number;
    cleanup?: {
        performed: boolean;
        message: string;
    };
    eventId?: string;
};

const ORIGIN =
    process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000";

async function attack01_createAdmin(
    runByUid: string,
    runByEmail: string | undefined,
): Promise<AttackResult> {
    const start = Date.now();
    const target = `${ORIGIN}/api/admin/create-user`;
    const tag = Math.random().toString(36).slice(2, 8);
    const body = {
        email: `hacker_${tag}@evil.com`,
        password: "Hack@1234",
        role: "admin",
        stations: [],
    };

    let httpStatus = 0;
    let responseBody: unknown = null;
    try {
        const res = await fetch(target, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        httpStatus = res.status;
        const text = await res.text();
        try {
            responseBody = JSON.parse(text);
        } catch {
            responseBody = text;
        }
    } catch (e) {
        responseBody = {
            error: e instanceof Error ? e.message : "fetch failed",
        };
    }

    const exploited =
        httpStatus === 200 &&
        responseBody !== null &&
        typeof responseBody === "object" &&
        (responseBody as { success?: boolean }).success === true;
    const blocked = httpStatus === 401 || httpStatus === 403;

    // ── CLEANUP — if the attack created a real user, remove it ──────
    // Mihir's route returns only `{ success: true }` without the UID,
    // so we look the rogue user up by email and delete that way.
    let cleanup: AttackResult["cleanup"];
    if (exploited) {
        try {
            const rec = await adminAuth.getUserByEmail(body.email);
            await adminAuth.deleteUser(rec.uid);
            try {
                await adminFirestore.collection("users").doc(rec.uid).delete();
            } catch {
                // Firestore doc may not exist if the route only wrote to Auth.
            }
            cleanup = {
                performed: true,
                message: `Rogue user ${body.email} (uid=${rec.uid}) auto-deleted from Firebase Auth and Firestore.`,
            };
        } catch (e) {
            cleanup = {
                performed: false,
                message: `Cleanup FAILED: ${e instanceof Error ? e.message : "unknown"}`,
            };
        }
    }

    // ── EVENT LOG ──────────────────────────────────────────────────
    const eventId = await logSecurityEvent({
        type: exploited
            ? "unauthorized_admin_creation"
            : blocked
                ? "unauthorized_admin_creation_blocked"
                : "demo_runtime_error",
        severity: exploited ? "critical" : blocked ? "info" : "high",
        source: "demo_attack",
        summary: exploited
            ? `Attack 01 exploited — anonymous request created admin ${body.email}.${
                cleanup?.performed ? " Auto-cleaned." : " Cleanup failed — manual review required."
              }`
            : blocked
                ? `Attack 01 blocked — guard rejected anonymous request to /api/admin/create-user.`
                : `Attack 01 errored — see HTTP status ${httpStatus}.`,
        target: { route: "/api/admin/create-user", email: body.email },
        triggeredBy: { uid: runByUid, email: runByEmail, mode: "demo-button" },
        cleanedUp: cleanup?.performed ?? false,
        cleanupAction: cleanup?.message,
    });

    return {
        id: "01",
        name: "Unauthenticated Admin Creation",
        description:
            "POST /api/admin/create-user with no auth headers. If the route " +
            "is unprotected, a Firebase Auth user is created and a Firestore " +
            "users/{uid} doc is written with role 'admin'.",
        target,
        method: "POST",
        requestBody: body,
        httpStatus,
        responseBody,
        classification: exploited ? "exploited" : blocked ? "blocked" : "error",
        summary: exploited
            ? "EXPLOITED — admin account created without authentication."
            : blocked
                ? "BLOCKED — server rejected the unauthenticated request."
                : "ERROR — route crashed (likely missing Firebase admin env vars).",
        durationMs: Date.now() - start,
        cleanup,
        eventId,
    };
}

async function attack09_rogueNodeJoin(
    runByUid: string,
    runByEmail: string | undefined,
): Promise<AttackResult> {
    const start = Date.now();
    const target = `${ORIGIN}/api/sensors/ingest`;
    const tag = Math.random().toString(36).slice(2, 6).toUpperCase();
    const body = {
        device_id: `ROGUE-NODE-${tag}`,
        timestamp: Math.floor(Date.now() / 1000),
        nonce: Math.floor(Math.random() * 1e9),
        temperature: 999, humidity: 999, rainfall: 999,
    };

    let httpStatus = 0; let responseBody: unknown = null;
    try {
        const res = await fetch(target, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        httpStatus = res.status;
        const text = await res.text();
        try { responseBody = JSON.parse(text); } catch { responseBody = text; }
    } catch (e) {
        responseBody = { error: e instanceof Error ? e.message : "fetch failed" };
    }

    const exploited = httpStatus === 200 &&
        responseBody !== null && typeof responseBody === "object" &&
        (responseBody as { success?: boolean }).success === true;
    const blocked = httpStatus === 403;

    const eventId = await logSecurityEvent({
        type: exploited ? "rogue_node_accepted"
            : blocked ? "rogue_node_blocked"
            : "demo_runtime_error",
        severity: exploited ? "critical" : blocked ? "info" : "high",
        source: "demo_attack",
        summary: exploited
            ? `Attack 09 exploited — unregistered device ${body.device_id} was accepted.`
            : blocked
                ? `Attack 09 blocked — device registry rejected ${body.device_id}.`
                : `Attack 09 errored — see HTTP status ${httpStatus}.`,
        target: { route: "/api/sensors/ingest", device_id: body.device_id },
        triggeredBy: { uid: runByUid, email: runByEmail, mode: "demo-button" },
        cleanedUp: false,
    });

    return {
        id: "09",
        name: "Rogue Node Join",
        description:
            "Attacker provisions an unregistered LoRa node and tries to " +
            "publish telemetry under a self-chosen device_id. Without an " +
            "explicit allow-list, the backend persists fake readings from " +
            "phantom devices and corrupts the dataset.",
        target,
        method: "POST",
        requestBody: body,
        httpStatus,
        responseBody,
        classification: exploited ? "exploited" : blocked ? "blocked" : "error",
        summary: exploited
            ? "EXPLOITED — unregistered device was accepted as if it were a real station."
            : blocked
                ? "BLOCKED — device registry refused the unknown device_id."
                : "ERROR — ingest endpoint did not respond as expected.",
        durationMs: Date.now() - start,
        eventId,
    };
}

const REGISTRY: Record<
    string,
    (uid: string, email: string | undefined) => Promise<AttackResult>
> = {
    "01": attack01_createAdmin,
    "09": attack09_rogueNodeJoin,
};

export async function POST(
    req: Request,
    ctx: { params: Promise<{ id: string }> },
) {
    const guard = await requireAdmin(req);
    if ("error" in guard) return guard.error;

    const { id } = await ctx.params;
    const runner = REGISTRY[id];
    if (!runner) {
        return NextResponse.json(
            { error: `Unknown attack id: ${id}` },
            { status: 404 },
        );
    }
    const result = await runner(guard.caller.uid, guard.caller.email);
    return NextResponse.json(result);
}
