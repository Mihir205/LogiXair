/**
 * MQTT attack-attempt loggers — nested under mqttAttempts/<kind>/log/<id>
 * so the Firestore console groups all 8 MQTT attack collections inside a
 * single `mqttAttempts` root entry instead of cluttering the top level.
 *
 * Sibling helper for LoRa lives in `loraAttemptLogger.ts` with the same
 * shape.
 */
import { adminFirestore } from "@/lib/firebaseAdmin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export type AttemptDoc = {
    blocked: boolean;
    reason: string;
    detail?: string;
    payload?: unknown;
    payload_size?: number;
    guard_enabled?: boolean;
    attempt_at: Timestamp;
};

const ROOT = "mqttAttempts";

async function safeAdd(kind: string, doc: AttemptDoc): Promise<void> {
    try {
        // Touch the parent doc so the console doesn't render it in italics.
        await adminFirestore
            .collection(ROOT)
            .doc(kind)
            .set({ category: "mqtt", kind, last_attempt_at: FieldValue.serverTimestamp() }, { merge: true });
        await adminFirestore
            .collection(ROOT)
            .doc(kind)
            .collection("log")
            .add(doc);
    } catch { /* never throw from a logger */ }
}

export function logWebhookSpoofAttempt(doc: Omit<AttemptDoc, "attempt_at">) {
    return safeAdd("webhookSpoof", { ...doc, attempt_at: Timestamp.now() });
}

export function logRetainedPoisonAttempt(doc: Omit<AttemptDoc, "attempt_at">) {
    return safeAdd("retainedPoison", { ...doc, attempt_at: Timestamp.now() });
}

export function logOversizedPayloadAttempt(doc: Omit<AttemptDoc, "attempt_at">) {
    return safeAdd("oversizedPayload", { ...doc, attempt_at: Timestamp.now() });
}

export function logAnonConnectAttempt(doc: Omit<AttemptDoc, "attempt_at">) {
    return safeAdd("anonConnect", { ...doc, attempt_at: Timestamp.now() });
}

export function logCrossStationPublishAttempt(doc: Omit<AttemptDoc, "attempt_at">) {
    return safeAdd("crossStationPublish", { ...doc, attempt_at: Timestamp.now() });
}

export function logMqttReplayAttempt(doc: Omit<AttemptDoc, "attempt_at">) {
    return safeAdd("replay", { ...doc, attempt_at: Timestamp.now() });
}

export function logMqttInjectionAttempt(doc: Omit<AttemptDoc, "attempt_at">) {
    return safeAdd("injection", { ...doc, attempt_at: Timestamp.now() });
}

export function logMqttPlaintextAttempt(doc: Omit<AttemptDoc, "attempt_at">) {
    return safeAdd("plaintext", { ...doc, attempt_at: Timestamp.now() });
}
