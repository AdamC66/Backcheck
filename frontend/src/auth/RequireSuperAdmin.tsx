import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { AuthPending } from "@/auth/AuthPending";
import { useAuth } from "@/auth/useAuth";

export function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <AuthPending />;
  }

  if (user === null) {
    return <Navigate to="/login" replace />;
  }

  if (!user.is_super_admin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
