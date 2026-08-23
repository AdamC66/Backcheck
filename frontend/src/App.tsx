import { Navigate, Route, Routes } from "react-router";
import { LoginPage } from "@/containers/LoginPage";
import { RedirectIfAuthenticated } from "@/auth/RedirectIfAuthenticated";
import { RequireAuth } from "@/auth/RequireAuth";
import { DashboardPage } from "@/containers/DashboardPage";
import { LeaguePage } from "@/containers/LeaguePage";
import { TeamPage } from "@/containers/TeamPage/TeamPage";
import { TeamOverviewPage } from "@/containers/TeamPage/TeamOverviewPage";
import { TeamSchedulePage } from "@/containers/TeamPage/TeamSchedulePage";
import { TeamRosterPage } from "@/containers/TeamPage/TeamRosterPage";

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
      <Route
        path="/leagues/:slug"
        element={
          <RequireAuth>
            <LeaguePage />
          </RequireAuth>
        }
      />
      <Route
        path="/teams/:id"
        element={
          <RequireAuth>
            <TeamPage />
          </RequireAuth>
        }
      >
        <Route index element={<TeamOverviewPage />} />
        <Route path="schedule" element={<TeamSchedulePage />} />
        <Route path="roster" element={<TeamRosterPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
