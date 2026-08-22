import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { AuthPending } from "@/auth/AuthPending";
import { returnPathFrom } from "@/lib/returnPath";
import { useAuth } from "@/auth/useAuth";

// The mirror of RequireAuth: keeps an authenticated user off /login. This is also what
// performs the post-login redirect — logging in populates the user, this re-renders and
// navigates, so LoginPage never has to call navigate() itself.
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthPending />;
  }

  if (user !== null) {
    return <Navigate to={returnPathFrom(location.state)} replace />;
  }

  return children;
}
