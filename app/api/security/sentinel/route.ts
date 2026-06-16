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
import { adminAuth } from "@/lib/firebaseAuth";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { logSecurityEvent } from "@/lib/security/logSecurityEvent";
import { listStaleDevices, STALE_THRESHOLD_SEC } from "@/lib/security/heartbeatTracker";
import { Timestamp } from "firebase-admin/firestore";

const ROGUE_EMAIL = /^hacker_.*@evil\.com$/i;

// How far back to look for rogue node activity each sweep.
const ROGUE_NODE_LOOKBACK_MS = 5 * 60 * 1000;

type RogueNodeHit = {
    device_id: string;
    reason: string;
    blockedAt: string;
};

type JammingHit = {
    device_id: string;
    silent_for_sec: number;
    last_seen_iso: string;
};

type SentinelReport = {
    scannedUsers: number;
    deleted: { uid: string; email: string; reason: string }[];
    rogueNodeAttempts: RogueNodeHit[];
    rogueNodeWindowSec: number;
    jammingSuspects: JammingHit[];
    jammingThresholdSec: number;
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

    // ── 3. Scan loraRogueJoinAttempts (continuous LoRa monitoring) ──
    const rogueNodeAttempts: RogueNodeHit[] = [];
    try {
        const since = Timestamp.fromMillis(Date.now() - ROGUE_NODE_LOOKBACK_MS);
        const rogueSnap = await adminFirestore
            .collection("loraRogueJoinAttempts")
            .where("blockedAt", ">=", since)
            .limit(50)
            .get();
        for (const d of rogueSnap.docs) {
            const data = d.data() as { device_id?: string; reason?: string; blockedAt?: Timestamp };
            rogueNodeAttempts.push({
                device_id: data.device_id ?? "(unknown)",
                reason: data.reason ?? "—",
                blockedAt: data.blockedAt?.toDate().toISOString() ?? "",
            });
        }
        rogueNodeAttempts.sort((a, b) => b.blockedAt.localeCompare(a.blockedAt));
    } catch (e) {
        console.log("[sentinel] rogue-node scan failed:", e instanceof Error ? e.message : e);
    }

    // ── 4. Jamming watchdog — flag devices that stopped checking in ──
    const jammingSuspects: JammingHit[] = [];
    try {
        const stale = listStaleDevices();
        for (const s of stale) {
            jammingSuspects.push({
                device_id: s.device_id,
                silent_for_sec: s.silent_for_sec,
                last_seen_iso: s.last_seen_iso,
            });
            // Log to security_events only on the first detection per device.
            if (s.first_detection) {
                try {
                    await logSecurityEvent({
                        type: "lora_jamming_suspected",
                        severity: "high",
                        source: "system",
                        summary: `LoRa link loss / possible jamming on ${s.device_id} (silent ${s.silent_for_sec}s).`,
                        target: { device_id: s.device_id, last_seen: s.last_seen_iso },
                        triggeredBy: { mode: "sentinel", caller: triggeredBy },
                    });
                } catch { /* drop silently */ }
            }
        }
    } catch (e) {
        console.log("[sentinel] jamming scan failed:", e instanceof Error ? e.message : e);
    }

    const durationMs = Date.now() - start;
    console.log(`[sentinel] sweep done — scanned ${scannedUsers} users + ${rogueNodeAttempts.length} rogue + ${jammingSuspects.length} jamming in ${durationMs}ms, deleted ${deleted.length}`);
    return {
        scannedUsers,
        deleted,
        rogueNodeAttempts,
        rogueNodeWindowSec: Math.floor(ROGUE_NODE_LOOKBACK_MS / 1000),
        jammingSuspects,
        jammingThresholdSec: STALE_THRESHOLD_SEC,
        durationMs,
    };
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
