import { Navigate, Route, Routes } from "react-router";
import { LoginPage } from "@/features/auth/LoginPage";
import { RedirectIfAuthenticated } from "@/features/auth/RedirectIfAuthenticated";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

export function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <LoginPage />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
