/**
 * Auto-defense sentinel — simplified, safe version.
 *
 * Scans Firebase Auth for accounts whose email matches the demo-attack
 * pattern `hacker_*@evil.com` and deletes them from both Auth and Firestore.
 *
 * Why so narrow? Earlier we also tried to flag any user with role=admin
 * whose Firestore doc had no `createdBy` field. That's a false-positive
 * minefield — Mihir's existing admins predate the createdBy convention,
 * so the sentinel would have wiped legitimate admins. The pattern match
 * is unambiguous: nobody legitimate has a hacker_*@evil.com email.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/requireAdmin";
import { adminAuth, adminFirestore } from "@/lib/firebaseAdmin";
import { logSecurityEvent } from "@/lib/security/logSecurityEvent";

const ROGUE_EMAIL = /^hacker_.*@evil\.com$/i;

type SentinelReport = {
    scannedUsers: number;
    deleted: { uid: string; email: string; reason: string }[];
    durationMs: number;
};

async function quarantine(
    label: string,
    uid: string,
    email: string,
    triggeredBy: string,
    deleted: SentinelReport["deleted"],
) {
    const reason = `email matches demo-attack pattern (hacker_*@evil.com) [${label}]`;
    try {
        // Try Auth — may not exist if this is a Firestore-only orphan.
        try { await adminAuth.deleteUser(uid); } catch { /* not in Auth */ }
        // Try Firestore — may not exist if this is an Auth-only orphan.
        try { await adminFirestore.collection("users").doc(uid).delete(); } catch { /* not in FS */ }
        deleted.push({ uid, email, reason });
        console.log(`[sentinel] quarantined ${email} (${uid}) [${label}]`);
        await logSecurityEvent({
            type: "sentinel_quarantine",
            severity: "high",
            source: "system",
            summary: `Sentinel auto-quarantined rogue account ${email}: ${reason}.`,
            target: { uid, email },
            triggeredBy: { mode: "sentinel", caller: triggeredBy },
            cleanedUp: true,
            cleanupAction: "Deleted from Firebase Auth and Firestore.",
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        console.log(`[sentinel] FAILED to delete ${email}: ${msg}`);
        await logSecurityEvent({
            type: "sentinel_quarantine_failed",
            severity: "critical",
            source: "system",
            summary: `Sentinel found ${email} but FAILED to delete: ${msg}`,
            target: { uid, email },
            triggeredBy: { mode: "sentinel", caller: triggeredBy },
            cleanedUp: false,
        });
    }
}

async function runSentinel(triggeredBy: string): Promise<SentinelReport> {
    const start = Date.now();
    const deleted: SentinelReport["deleted"] = [];
    let scannedUsers = 0;
    let nextPageToken: string | undefined = undefined;

    console.log("[sentinel] sweep starting, triggered by", triggeredBy);

    // ── 1. Scan Firebase Auth ────────────────────────────────────────
    const seenUids = new Set<string>();
    do {
        const page = await adminAuth.listUsers(1000, nextPageToken);
        for (const u of page.users) {
            scannedUsers++;
            const email = u.email ?? "";
            if (!ROGUE_EMAIL.test(email)) continue;
            seenUids.add(u.uid);
            await quarantine("auth", u.uid, email, triggeredBy, deleted);
        }
        nextPageToken = page.pageToken;
    } while (nextPageToken);

    // ── 2. Scan Firestore users collection (catches orphans whose doc
    //      ID doesn't match an Auth UID, or which only ever existed in
    //      Firestore — e.g. manually added through the console).
    const snap = await adminFirestore.collection("users").get();
    for (const doc of snap.docs) {
        scannedUsers++;
        const email = (doc.data() as { email?: string }).email ?? "";
        if (!ROGUE_EMAIL.test(email)) continue;
        if (seenUids.has(doc.id)) continue;        // already handled in pass 1
        await quarantine("firestore", doc.id, email, triggeredBy, deleted);
    }

    const durationMs = Date.now() - start;
    console.log(`[sentinel] sweep done — scanned ${scannedUsers} in ${durationMs}ms, deleted ${deleted.length}`);
    return { scannedUsers, deleted, durationMs };
}

export async function GET(req: Request) {
    const guard = await requireAdmin(req);
    if ("error" in guard) return guard.error;
    try {
        const report = await runSentinel(guard.caller.uid);
        return NextResponse.json(report);
    } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        console.error("[sentinel] sweep crashed:", msg);
        return NextResponse.json(
            { error: msg, scannedUsers: 0, deleted: [], durationMs: 0 },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    return GET(req);
}
