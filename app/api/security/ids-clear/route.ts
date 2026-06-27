/**
 * Admin-only: delete every doc in the `idsAlerts` collection.
 * Used by the "Clear all" button on the Sentinel page.
 *
 * Batched 400 at a time (Firestore write-batch hard limit is 500;
 * keep margin for safety).
 */
import { NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/security/requireAdmin";

export async function POST(req: Request) {
    const guard = await requireAdmin(req);
    if ("error" in guard) return guard.error;

    let deleted = 0;
    try {
        // Page through to avoid loading the whole collection at once.
        while (true) {
            const snap = await adminFirestore.collection("idsAlerts").limit(400).get();
            if (snap.empty) break;
            const batch = adminFirestore.batch();
            for (const d of snap.docs) batch.delete(d.ref);
            await batch.commit();
            deleted += snap.size;
            if (snap.size < 400) break;
        }
        return NextResponse.json({ success: true, deleted });
    } catch (e) {
        return NextResponse.json(
            { success: false, error: e instanceof Error ? e.message : "unknown", deleted },
            { status: 500 },
        );
    }
}
