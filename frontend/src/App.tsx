import { Navigate, Route, Routes } from "react-router";
import { LoginPage } from "@/containers/LoginPage";
import { RedirectIfAuthenticated } from "@/auth/RedirectIfAuthenticated";
import { RequireAuth } from "@/auth/RequireAuth";
import { RequireSuperAdmin } from "@/auth/RequireSuperAdmin";
import { DashboardPage } from "@/containers/DashboardPage";
import { GamePage } from "@/containers/GamePage";
import { LeaguePage } from "@/containers/LeaguePage";
import { PlayerPage } from "@/containers/PlayerPage";
import { TeamPage } from "@/containers/TeamPage/TeamPage";
import { TeamOverviewPage } from "@/containers/TeamPage/TeamOverviewPage";
import { TeamSchedulePage } from "@/containers/TeamPage/TeamSchedulePage";
import { TeamRosterPage } from "@/containers/TeamPage/TeamRosterPage";
import { TeamStatsPage } from "@/containers/TeamPage/TeamStatsPage";
import { AdminPage } from "@/containers/Admin/AdminPage";
import { SyncDashboardPage } from "@/containers/Admin/SyncDashboardPage";
import { NewSyncRunPage } from "@/containers/Admin/NewSyncRunPage";
import { SyncRunDetailPage } from "@/containers/Admin/SyncRunDetailPage";
import { RoadmapPage } from "@/containers/Admin/RoadmapPage";

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
        path="/games/:id"
        element={
          <RequireAuth>
            <GamePage />
          </RequireAuth>
        }
      />
      <Route
        path="/players/:id"
        element={
          <RequireAuth>
            <PlayerPage />
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
        <Route path="stats" element={<TeamStatsPage />} />
      </Route>
      <Route
        path="/admin"
        element={
          <RequireSuperAdmin>
            <AdminPage />
          </RequireSuperAdmin>
        }
      >
        <Route index element={<SyncDashboardPage />} />
        <Route path="sync/new" element={<NewSyncRunPage />} />
        <Route path="sync/:id" element={<SyncRunDetailPage />} />
        <Route path="roadmap" element={<RoadmapPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
