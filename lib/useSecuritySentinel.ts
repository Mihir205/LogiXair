"use client";

/**
 * Polls /api/security/sentinel every 30s. The sentinel scans Firebase Auth
 * + Firestore for rogue admin accounts and deletes any it finds. Returns
 * the latest report so the dashboard can display sentinel status.
 */
import { useEffect, useState } from "react";
import { auth } from "./firebase";

export type SentinelDeletion = {
    uid: string;
    email: string;
    reason: string;
};

export type SentinelReport = {
    scannedUsers: number;
    deleted: SentinelDeletion[];
    durationMs: number;
    runAt: Date;
};

export default function useSecuritySentinel(intervalMs = 30_000) {
    const [report, setReport] = useState<SentinelReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function tick() {
            if (cancelled) return;
            setBusy(true);
            try {
                const user = auth.currentUser;
                if (!user) {
                    setError("Not signed in.");
                    return;
                }
                const token = await user.getIdToken();
                const res = await fetch("/api/security/sentinel", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    setError(`Sentinel HTTP ${res.status}`);
                    return;
                }
                const data = (await res.json()) as Omit<SentinelReport, "runAt">;
                if (!cancelled) {
                    setReport({ ...data, runAt: new Date() });
                    setError(null);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : "unknown");
                }
            } finally {
                if (!cancelled) setBusy(false);
            }
        }

        // Run once immediately, then on an interval.
        tick();
        const id = setInterval(tick, intervalMs);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [intervalMs]);

    return { report, error, busy };
}
