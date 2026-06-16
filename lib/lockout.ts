/**
 * Client-side brute-force lockout helper for the LogiXair Firebase build.
 *
 * Mirrors the FastAPI backend behaviour (5 wrong attempts -> 15 min lock,
 * auto-unlock when timer expires). Stored in Firestore so the Admin Security
 * Center can list every locked / at-risk account in real time.
 *
 * NOTE — this is enforced from the client. For a production deployment the
 * same logic should be moved into a Cloud Function (or Firestore security
 * rules) so a tampered client cannot bypass the counter. For the demo this
 * matches the threat model used by the rest of the cybersecurity section.
 */
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "./firebase";

export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;

export interface LockoutStatus {
  email: string;
  failed_attempts: number;
  attempts_remaining: number;
  max_attempts: number;
  is_locked: boolean;
  lock_seconds_remaining: number;
}

function keyFor(email: string) {
  return email.trim().toLowerCase();
}

function secondsUntil(ts: Timestamp | null | undefined): number {
  if (!ts) return 0;
  const ms = ts.toMillis() - Date.now();
  return Math.max(0, Math.floor(ms / 1000));
}

export async function readLockout(email: string): Promise<LockoutStatus> {
  const id = keyFor(email);
  const ref = doc(firestore, "loginAttempts", id);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : null;
  const failed = (data?.failed_attempts as number) ?? 0;
  const lockedUntil = (data?.locked_until as Timestamp | null) ?? null;
  const remaining = secondsUntil(lockedUntil);
  return {
    email: id,
    failed_attempts: failed,
    attempts_remaining: Math.max(0, MAX_ATTEMPTS - failed),
    max_attempts: MAX_ATTEMPTS,
    is_locked: remaining > 0,
    lock_seconds_remaining: remaining,
  };
}

export async function recordFailure(email: string): Promise<LockoutStatus> {
  const id = keyFor(email);
  const ref = doc(firestore, "loginAttempts", id);
  const snap = await getDoc(ref);
  const prev = snap.exists() ? snap.data() : {};
  const attempts = ((prev?.failed_attempts as number) ?? 0) + 1;
  const patch: Record<string, unknown> = {
    email: id,
    failed_attempts: attempts,
    updated_at: serverTimestamp(),
  };
  if (attempts >= MAX_ATTEMPTS) {
    patch.locked_until = Timestamp.fromMillis(
      Date.now() + LOCKOUT_MINUTES * 60 * 1000
    );
  }
  await setDoc(ref, patch, { merge: true });
  return readLockout(email);
}

export async function resetLockout(email: string): Promise<void> {
  const id = keyFor(email);
  await setDoc(
    doc(firestore, "loginAttempts", id),
    {
      email: id,
      failed_attempts: 0,
      locked_until: null,
      updated_at: serverTimestamp(),
    },
    { merge: true }
  );
}

export function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
