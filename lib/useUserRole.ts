"use client";

import { useEffect, useState } from "react";
import { auth, firestore } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

type Role = "admin" | "operator" | "user";

export default function useUserRole() {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        try {
          const userDoc = await getDoc(
            doc(firestore, "users", user.uid)
          );

          if (userDoc.exists()) {
            const firestoreRole =
              userDoc.data().role as Role;

            setRole(firestoreRole);

            console.log("Auth User:", user.email);
            console.log("UID:", user.uid);
            console.log("Role:", firestoreRole);
          }
        } catch (error) {
          console.error(error);
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { role, loading };
}