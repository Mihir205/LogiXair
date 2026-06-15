import { getAuth } from "firebase-admin/auth";
import { adminApp } from "./firebaseAdmin";

export const adminAuth = getAuth(adminApp);