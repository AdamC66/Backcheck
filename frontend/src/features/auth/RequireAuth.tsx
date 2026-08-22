import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { AuthPending } from "@/features/auth/AuthPending";
import { useAuth } from "@/features/auth/useAuth";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthPending />;
  }

  if (user === null) {
    // Carrying the attempted path means a deep link survives the login detour.
    return (
      <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
    );
  }

  return children;
}
