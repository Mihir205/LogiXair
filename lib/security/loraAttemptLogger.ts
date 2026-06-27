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

export type LoraAttemptInput = {
    device_id: string;
    reason: string;
    detail?: string;
    [extra: string]: unknown;
};

async function safeAdd(kind: string, input: LoraAttemptInput): Promise<void> {
    try {
        await adminFirestore
            .collection(LORA_ATTEMPTS_ROOT)
            .doc(kind)
            .set({ category: "lora", kind, last_attempt_at: FieldValue.serverTimestamp() }, { merge: true });
        await adminFirestore
            .collection(LORA_ATTEMPTS_ROOT)
            .doc(kind)
            .collection("log")
            .add({ ...input, blockedAt: Timestamp.now() });
    } catch { /* never throw from a logger */ }
}

export function logLoraRogueJoinAttempt(input: LoraAttemptInput) {
    return safeAdd("rogueJoin", input);
}

export function logLoraInjectionAttempt(input: LoraAttemptInput) {
    return safeAdd("injection", input);
}

export function logLoraReplayAttempt(input: LoraAttemptInput) {
    return safeAdd("replay", input);
}

export function logLoraPlaintextAttempt(input: LoraAttemptInput) {
    return safeAdd("plaintext", input);
}

/** Path helper for the Sentinel to read a specific kind's log subcollection. */
export function loraAttemptLogRef(kind: string): CollectionReference {
    return adminFirestore.collection(LORA_ATTEMPTS_ROOT).doc(kind).collection("log");
}
