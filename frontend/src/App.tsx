import { Navigate, Route, Routes } from "react-router";
import { LoginPage } from "@/containers/LoginPage";
import { RedirectIfAuthenticated } from "@/auth/RedirectIfAuthenticated";
import { RequireAuth } from "@/auth/RequireAuth";
import { RequireSuperAdmin } from "@/auth/RequireSuperAdmin";
import { DashboardPage } from "@/containers/DashboardPage";
import { GamePage } from "@/containers/GamePage/GamePage";
import { GameSheetPage } from "@/containers/GamePage/GameSheetPage";
import { GameStatsPage } from "@/containers/GamePage/GameStatsPage";
import { GameAdvancedStatsPage } from "@/containers/GamePage/GameAdvancedStatsPage";
import { GameChartsPage } from "@/containers/GamePage/GameChartsPage";
import { LeaguePage } from "@/containers/LeaguePage/LeaguePage";
import { LeagueOverviewPage } from "@/containers/LeaguePage/LeagueOverviewPage";
import { LeagueStandingsPage } from "@/containers/LeaguePage/LeagueStandingsPage";
import { LeagueStatsPage } from "@/containers/LeaguePage/LeagueStatsPage";
import { PlayerPage } from "@/containers/PlayerPage";
import { TeamPage } from "@/containers/TeamPage/TeamPage";
import { TeamOverviewPage } from "@/containers/TeamPage/TeamOverviewPage";
import { TeamSchedulePage } from "@/containers/TeamPage/TeamSchedulePage";
import { TeamRosterPage } from "@/containers/TeamPage/TeamRosterPage";
import { TeamLineupsPage } from "@/containers/TeamPage/TeamLineupsPage";
import { TeamStatsPage } from "@/containers/TeamPage/TeamStatsPage";
import { TeamShotMapPage } from "@/containers/TeamPage/TeamShotMapPage";
import { AdminPage } from "@/containers/Admin/AdminPage";
import { SyncDashboardPage } from "@/containers/Admin/SyncDashboardPage";
import { NewSyncRunPage } from "@/containers/Admin/NewSyncRunPage";
import { SyncRunDetailPage } from "@/containers/Admin/SyncRunDetailPage";
import { DataCoveragePage } from "@/containers/Admin/DataCoveragePage";
import { CoverageGapPage } from "@/containers/Admin/CoverageGapPage";
import { RoadmapPage } from "@/containers/Admin/RoadmapPage";
import { XgModelPage } from "@/containers/Admin/XgModelPage";
import { XgMethodPage } from "@/containers/Admin/XgMethodPage";
import { RinkGlossaryPage } from "@/containers/Admin/RinkGlossaryPage";

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
      >
        <Route index element={<LeagueOverviewPage />} />
        <Route path="standings" element={<LeagueStandingsPage />} />
        <Route path="stats" element={<LeagueStatsPage />} />
      </Route>
      <Route
        path="/games/:id"
        element={
          <RequireAuth>
            <GamePage />
          </RequireAuth>
        }
      >
        <Route index element={<GameSheetPage />} />
        <Route path="stats" element={<GameStatsPage />} />
        <Route path="advanced" element={<GameAdvancedStatsPage />} />
        <Route path="charts" element={<GameChartsPage />} />
      </Route>
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
        <Route path="lineups" element={<TeamLineupsPage />} />
        <Route path="stats" element={<TeamStatsPage />} />
        <Route path="shots" element={<TeamShotMapPage />} />
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
        <Route path="data" element={<DataCoveragePage />} />
        <Route path="data/:seasonId/:kind" element={<CoverageGapPage />} />
        <Route path="roadmap" element={<RoadmapPage />} />
        <Route path="xg-model" element={<XgModelPage />} />
        <Route path="xg-method" element={<XgMethodPage />} />
        <Route path="rink" element={<RinkGlossaryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
