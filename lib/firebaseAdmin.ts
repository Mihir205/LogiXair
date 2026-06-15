import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getDatabase } from "firebase-admin/database";

export const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey:
            process.env.FIREBASE_PRIVATE_KEY?.replace(
              /\\n/g,
              "\n"
            ),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });

export const adminFirestore = getFirestore(adminApp);
export const adminDatabase = getDatabase(adminApp);