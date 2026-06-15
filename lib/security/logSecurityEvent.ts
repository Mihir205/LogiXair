/**
 * Append-only audit log for security-relevant events.
 *
 * Writes to Firestore `security_events`. Admin SDK only — clients can
 * subscribe to the collection in read-only mode, but the document writer
 * is always the backend (so attackers can't fabricate "all clear" events).
 */
import { adminFirestore } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

export type SecuritySeverity = "critical" | "high" | "medium" | "low" | "info";

export type SecurityEventInput = {
    type: string;             // machine-readable e.g. "unauthorized_admin_creation"
    severity: SecuritySeverity;
    source: "demo_attack" | "real_request" | "system";
    summary: string;          // 1-line human-readable
    target?: Record<string, unknown>;
    triggeredBy?: Record<string, unknown>;
    cleanedUp?: boolean;
    cleanupAction?: string;
    extra?: Record<string, unknown>;
};

export async function logSecurityEvent(evt: SecurityEventInput): Promise<string> {
    // Firestore rejects writes that contain undefined field values. Strip
    // them before persisting so optional fields (cleanupAction on blocked
    // attacks, extra on most events) don't crash the writer.
    const clean: Record<string, unknown> = { timestamp: Timestamp.now() };
    for (const [k, v] of Object.entries(evt)) {
        if (v !== undefined) clean[k] = v;
    }
    const doc = await adminFirestore.collection("security_events").add(clean);
    return doc.id;
}
