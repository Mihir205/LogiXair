import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const app = getApps()[0];

export const adminAuth = getAuth(app);