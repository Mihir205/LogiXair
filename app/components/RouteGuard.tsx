"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useUserRole from "../../lib/useUserRole";

interface Props {
  allowedRole: "admin" | "operator" | "user";
  children: React.ReactNode;
}

export default function RouteGuard({
  allowedRole,
  children,
}: Props) {
  const { role, loading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== allowedRole) {
      router.replace("/");
    }
  }, [role, loading, allowedRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Verifying Access...
      </div>
    );
  }

  if (loading || role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Verifying Access...
      </div>
    );
  }

  return <>{children}</>;
}