/**
 * LoRa attack-attempt loggers — nested under loraAttempts/<kind>/log/<id>
 * to keep the Firestore console root tidy. Mirrors mqttAttemptLogger.ts.
 *
 * Subcollection helpers also expose the parent-collection path for the
 * Sentinel to read across all kinds when monitoring rogue activity.
 */
import { adminFirestore } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue, type CollectionReference } from "firebase-admin/firestore";

export const LORA_ATTEMPTS_ROOT = "loraAttempts";

export type LoraAttemptDoc = {
    device_id: string;
    reason: string;
    detail?: string;
    blockedAt: Timestamp;
    [key: string]: unknown;
};

async function safeAdd(kind: string, doc: LoraAttemptDoc): Promise<void> {
    try {
        await adminFirestore
            .collection(LORA_ATTEMPTS_ROOT)
            .doc(kind)
            .set({ category: "lora", kind, last_attempt_at: FieldValue.serverTimestamp() }, { merge: true });
        await adminFirestore
            .collection(LORA_ATTEMPTS_ROOT)
            .doc(kind)
            .collection("log")
            .add(doc);
    } catch { /* never throw from a logger */ }
}

export function logLoraRogueJoinAttempt(doc: Omit<LoraAttemptDoc, "blockedAt">) {
    return safeAdd("rogueJoin", { ...doc, blockedAt: Timestamp.now() });
}

export function logLoraInjectionAttempt(doc: Omit<LoraAttemptDoc, "blockedAt">) {
    return safeAdd("injection", { ...doc, blockedAt: Timestamp.now() });
}

export function logLoraReplayAttempt(doc: Omit<LoraAttemptDoc, "blockedAt">) {
    return safeAdd("replay", { ...doc, blockedAt: Timestamp.now() });
}

export function logLoraPlaintextAttempt(doc: Omit<LoraAttemptDoc, "blockedAt">) {
    return safeAdd("plaintext", { ...doc, blockedAt: Timestamp.now() });
}

/** Path helper for the Sentinel to read a specific kind's log subcollection. */
export function loraAttemptLogRef(kind: string): CollectionReference {
    return adminFirestore.collection(LORA_ATTEMPTS_ROOT).doc(kind).collection("log");
}
