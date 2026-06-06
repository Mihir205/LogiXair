import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBofnSB8WyV28Is-6zU_TxWbliDDcMNu0A",
  authDomain: "weather-app-2-920f0.firebaseapp.com",
  databaseURL: "https://weather-app-2-920f0-default-rtdb.firebaseio.com",
  projectId: "weather-app-2-920f0",
  storageBucket: "weather-app-2-920f0.firebasestorage.app",
  messagingSenderId: "558217112464",
  appId: "1:558217112464:web:e5873ac5f4d50892c9e115",
  measurementId: "G-DGEPJNL4SP"
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

export const auth = getAuth(app);

export const db = getDatabase(app);

export const firestore = getFirestore(app);