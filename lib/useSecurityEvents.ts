"use client";

/**
 * Real-time subscription to the security_events Firestore collection.
 * Used by the Cybersecurity Demos page to display incoming alerts as
 * soon as the attack runner logs them.
 */
import { useEffect, useState } from "react";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    limit,
    Timestamp,
} from "firebase/firestore";
import { firestore } from "./firebase";

export type SecurityEvent = {
    id: string;
    type: string;
    severity: "critical" | "high" | "medium" | "low" | "info";
    source: "demo_attack" | "real_request" | "system";
    summary: string;
    cleanedUp?: boolean;
    cleanupAction?: string;
    target?: Record<string, unknown>;
    triggeredBy?: Record<string, unknown>;
    timestamp?: Timestamp;
};

export default function useSecurityEvents(max: number = 25) {
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(
            collection(firestore, "security_events"),
            orderBy("timestamp", "desc"),
            limit(max),
        );
        const unsub = onSnapshot(
            q,
            (snap) => {
                const next: SecurityEvent[] = snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as Omit<SecurityEvent, "id">),
                }));
                setEvents(next);
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            },
        );
        return () => unsub();
    }, [max]);

    return { events, loading, error };
}
