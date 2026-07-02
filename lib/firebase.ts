import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Firebase Web SDK config. These NEXT_PUBLIC_* values are injected at build
// time and end up in the client bundle — by Firebase's design (the browser
// needs them to talk to identity-toolkit). The real defenses are:
//   - HTTP referrer restriction on the API key (Google Cloud Console → Credentials)
//   - Firestore security rules (not the catch-all in firestore.rules.example)
//   - Firebase Auth quotas + App Check
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL:       process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

// App Check (reCAPTCHA v3) — proves requests come from OUR app, blocking
// bots/scripts hitting Firebase directly. Browser-only (needs window), and
// guarded so HMR / double-import can't double-initialize. Starts in Monitor
// mode until each service is flipped to Enforce in the Firebase console.
if (typeof window !== "undefined") {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (siteKey && !(globalThis as any).__APP_CHECK_INIT__) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
      (globalThis as any).__APP_CHECK_INIT__ = true;
    } catch {
      /* already initialized — ignore */
    }
  }
}

export const auth = getAuth(app);

export const db = getDatabase(app);

export const firestore = getFirestore(app);