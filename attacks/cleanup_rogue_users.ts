/**
 * One-shot cleanup for rogue users left behind by earlier attack runs.
 *
 * Run:
 *     cd C:\Users\vssva\OneDrive\Desktop\LogiXair
 *     npx tsx attacks/cleanup_rogue_users.ts
 *
 * Safe to re-run. Idempotent.
 */
import * as fs from "fs";
import * as path from "path";

// ── 1. Load .env.local manually ─────────────────────────────────────
// Imports are hoisted before any code, so we cannot import firebaseAdmin
// at the top of the file — it would initialize with empty env vars. We
// load .env.local first and then DYNAMICALLY import the admin SDK below.
const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
    console.error(`Cannot find .env.local at ${envPath}.`);
    console.error("Run this script from the LogiXair project root.");
    process.exit(1);
}
for (const raw of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
    }
    val = val.replace(/\\n/g, "\n");
    if (process.env[key] === undefined) process.env[key] = val;
}

const PATTERN = /^hacker_.*@evil\.com$/i;

// ── 2. Dynamically import the admin SDK now that env is populated ──
async function main() {
    const { adminFirestore } =
        await import("../lib/firebaseAdmin");

    const { adminAuth } =
        await import("../lib/firebaseAuth");

    console.log("Scanning Firebase Auth for rogue users…");
    let nextPageToken: string | undefined = undefined;
    let totalChecked = 0;
    const rogueUids: { uid: string; email: string }[] = [];

    do {
        const page = await adminAuth.listUsers(1000, nextPageToken);
        for (const u of page.users) {
            totalChecked++;
            const e = u.email ?? "";
            if (PATTERN.test(e)) rogueUids.push({ uid: u.uid, email: e });
        }
        nextPageToken = page.pageToken;
    } while (nextPageToken);

    console.log(`Checked ${totalChecked} users. Found ${rogueUids.length} rogue accounts.`);

    if (rogueUids.length === 0) {
        console.log("Nothing to clean up.");
        return;
    }

    for (const { uid, email } of rogueUids) {
        try {
            await adminAuth.deleteUser(uid);
            try {
                await adminFirestore.collection("users").doc(uid).delete();
            } catch {
                // Firestore doc may not exist — that's fine.
            }
            console.log(`  deleted  ${email}  (${uid})`);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "unknown";
            console.log(`  FAILED   ${email}  (${uid}) — ${msg}`);
        }
    }

    console.log("Done.");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
