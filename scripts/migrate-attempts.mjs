// One-shot migration: COPY the old top-level attempt collections into
// the new nested layout under loraAttempts/<kind>/log and mqttAttempts/<kind>/log.
// Originals are kept in place (non-destructive).
//
// Usage (from project root):
//   node scripts/migrate-attempts.mjs              # dry-run, prints planned copies
//   node scripts/migrate-attempts.mjs --apply      # actually copy (originals kept)
//
// Service-account creds are read from .env.local exactly like the Next.js
// runtime, so no extra setup is needed.

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

// Minimal .env.local loader
const env = { ...process.env };
if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
        const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
        if (!m) continue;
        let v = m[2].trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        if (!env[m[1]]) env[m[1]] = v;
    }
}

const APPLY = process.argv.includes("--apply");

initializeApp({
    credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
});
const db = getFirestore();

// old-flat-collection-name  ->  [root, kind]
const MIGRATIONS = [
    ["loraRogueJoinAttempts",         "loraAttempts", "rogueJoin"],
    ["loraInjectionAttempts",         "loraAttempts", "injection"],
    ["loraReplayAttempts",            "loraAttempts", "replay"],
    ["loraPlaintextAttempts",         "loraAttempts", "plaintext"],
    ["mqttWebhookSpoofAttempts",      "mqttAttempts", "webhookSpoof"],
    ["mqttRetainedPoisonAttempts",    "mqttAttempts", "retainedPoison"],
    ["mqttOversizedPayloadAttempts",  "mqttAttempts", "oversizedPayload"],
    ["mqttAnonConnectAttempts",       "mqttAttempts", "anonConnect"],
    ["mqttCrossStationPublishAttempts","mqttAttempts", "crossStationPublish"],
];

async function migrateOne(oldName, root, kind) {
    const snap = await db.collection(oldName).get();
    const count = snap.size;
    if (count === 0) {
        console.log(`  ${oldName}: empty, skipping`);
        return { copied: 0 };
    }
    console.log(`  ${oldName}: ${count} docs -> ${root}/${kind}/log  (originals kept)`);
    if (!APPLY) return { copied: 0 };

    // 1. Ensure the parent doc exists with metadata
    const category = root === "loraAttempts" ? "lora" : "mqtt";
    await db.collection(root).doc(kind).set(
        { category, kind, last_attempt_at: Timestamp.now(), migrated_from: oldName },
        { merge: true },
    );

    // 2. Copy docs in batches of 400
    const targetCol = db.collection(root).doc(kind).collection("log");
    let copied = 0;
    let batch = db.batch();
    let opsInBatch = 0;
    for (const d of snap.docs) {
        const ref = targetCol.doc(d.id);          // preserve original doc-id
        batch.set(ref, d.data());
        opsInBatch++;
        if (opsInBatch >= 400) {
            await batch.commit();
            copied += opsInBatch;
            batch = db.batch();
            opsInBatch = 0;
        }
    }
    if (opsInBatch > 0) {
        await batch.commit();
        copied += opsInBatch;
    }
    return { copied };
}

(async () => {
    console.log(APPLY ? "APPLY MODE — copying (originals kept)\n" : "DRY RUN — planned copies only (pass --apply to execute)\n");
    let totalCopied = 0;
    for (const [oldName, root, kind] of MIGRATIONS) {
        const { copied } = await migrateOne(oldName, root, kind);
        totalCopied += copied;
    }
    console.log(`\nDone. ${totalCopied} docs copied. Original flat collections left untouched.`);
    process.exit(0);
})().catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
});
