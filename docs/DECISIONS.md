# Decision Log

Newest first. One entry per decision: what, why, alternatives considered.

---

### Searchable-table standard: backend-owned schema, composable query concerns (EPIC-14)
**Status:** Settled
The league-wide player table (EPIC-14) is the first backend-driven searchable/filterable/sortable/
paginated list — the trigger `DataTable` deferred its pagination/filtering row models for. Rather
than wire it one-off, it establishes the pattern for every such table after it.

- **Hybrid schema endpoint.** Each table resource serves `GET /<resource>/schema` →
  `{ columns, filters, search, sort }`. The backend owns which columns exist (key, label, tooltip,
  `format` token, sortable, group), every filter definition and its live option list (team list,
  seasons — league-dependent, so the schema refetches when `league` changes), the sort allowlist,
  and the default sort. The frontend owns only `lib/columnFormatters.ts` — a registry keyed by the
  `format` token (`int`, `decimal1/2`, `pct1/3`, `toi`, `plus_minus`, `text`). No per-page column
  hardcoding; the two sides can't drift, same reasoning as the `sync_kinds` endpoint. Rejected:
  fully-dynamic schema (format strings encode all rendering, frontend loses column types) and
  no-schema (frontend hardcodes, allowlists drift).
- **Composable query concerns, not a base class** (`app/queries/concerns/`): `Paginated`
  (offset pagination, grouped-count aware), `Searchable` (a `q` block + schema slice), `Filterable`
  (declared params, validated against an allowlist → 422 `InvalidFilter`, options for the schema),
  `Sortable` (public key → SQL expression map we control → 422 `InvalidSort`), `Columned` (the
  column list, which also derives the `Sortable` map so the two can't disagree). A query class
  `include`s the ones it needs. `PlayerStatSearch` is the EPIC-14
  domain module composing all five plus the skater/goalie aggregation; `LeagueSkaterSearch` /
  `LeagueGoalieSearch` are thin config. Controllers use the `TableEndpoint` concern
  (`render_table` / `render_schema`, two one-line actions, typed errors → 422/404).
- **One row per player, summed across team stints** in the league+season (leaderboard semantics).
  Done as a `GROUP BY player_id` aggregate subquery in `FROM (…) stats`, joined to `players` and
  LEFT-joined to the advanced-stat snapshot — so the outer relation stays group-free and
  pagination/sort/filter compose normally on top. A multi-team player serializes `team: "TOT"`.
- **Advanced columns join the latest `player_season_advanced_stats` snapshot** for the chosen
  strength/score split (default `all`/`all`), picked by `DISTINCT ON (player_id) … ORDER BY
  player_id, games_played DESC` — running totals only grow, so max `games_played` is the latest
  snapshot without needing to join `games` for `starts_at`. Null for non-NHL leagues. Skater
  table only; goalies have no Corsi-family stats computed.
- **All table state lives in the URL** (`useServerTable` + `useSearchParams`) — sort, dir, page,
  `q`, every filter — so a view is shareable and the back button works, the pattern `TeamStatsPage`
  already uses. `DataTable` gained an opt-in server-driven mode (`sorting` + `onSortingChange`
  props → `manualSorting`); existing team-scoped callers pass neither and are unchanged.

### Data tab: coverage computed live from the data tables, not from SyncRun (TASK-92)
**Status:** Settled
`SyncRun` history records what runs were *kicked off*, not what data *landed* — a run can complete
over already-synced data, or fail partway and leave silent gaps (found this way: NHL 2023-24 had
`game_stats` for 1215/1230 regular-season games and `advanced_stats` for 0/1230). New **Data** tab
in the admin console: pick a league, see a row per season with games / roster / stats / advanced
cells, each computed live by `LeagueCoverageMatrix` (`app/queries/`) straight from `Game`,
`RosterSpot`, `SkaterGameStat`, `PlayerGameAdvancedStat`, `PlayerSeasonAdvancedStat` — so it
reflects ground truth regardless of how the data got there. Advanced coverage keys off
`PlayerGameAdvancedStat` (computed output), not `GameEvent` (ingested play-by-play), so a game
whose compute step failed reads as not covered. Every column is one grouped query across the league's
season ids, never one per season (the per-column round-trip rule in `backend/CLAUDE.md`).

Decisions inside this:
- **games denominator** = the latest `team_standings` snapshot per team, `Σ games_played / 2`
  (upstream's own count of games played). Null when the league has no standings — the cell then
  shows just the synced count. This is the layer that surfaces missing *Game rows*; the stats /
  advanced cells measure against our own finished-regular-season game count, surfacing failed
  ingestion on top.
- **all leagues shown**, but `games`/`stats`/`advanced` are `n/a` (serialized as `null`) for a
  season with no `nhl_season_id` — HockeyTech leagues (AHL/ECHL) have no game-stats / advanced /
  standings path, only rosters. `nhl_season_id.present?` is the data-driven signal, not a slug check.
- **drill-down is a route** (`GET /admin/coverage/:season_id/:kind` → `CoverageGapList`, frontend
  `/admin/data/:seasonId/:kind`), listing the specific games (stats/advanced) or teams
  (games/roster) behind a cell — the per-game breakdown TASK-90's `failed_games` groundwork
  models, applied to coverage gaps.
- **invoke reuses `POST /admin/sync_runs`** — no new endpoint. Cell → sync kind:
  `games→team_schedule`, `roster→team_roster`, `stats→game_stats`, `advanced→advanced_stats`,
  all resolved from `league_id` + `season_id` (team omitted = whole league, which
  `AdminSyncOrchestrator#teams_for` already handles). A confirm dialog with the rate-limit preset
  gates the run.

### Missing player identity: self-heal in UpsertGameStats, not a historical roster pull
**Status:** Settled (design; implementation tracked as TASK-56)
Running the admin sync console against live 2026-27 data surfaced a real gap: a player who logged games/stats for a team in 2025-26 but has since left that org (trade, UFA, waivers, retirement) is invisible to us and stays that way permanently — not a timing issue that resolves once the API rolls onto the new season, because it already has, and the roster endpoint is inherently present-tense. The only thing that ever creates a `Player` row for an NHL player is `SyncTeamRoster`, which only ever syncs `/v1/roster/{team}/current` — never a past season. Once a player is off every current roster, no existing sync path can rediscover him, so `UpsertGameStats#player_for` finds no match and skips the stat row (reporting the id in `missing_players`) forever. This affects a full-career vet who's since moved on exactly the same way it affects a player whose entire NHL career was one or two games — both hit the identical code path.

Two fixes were considered. **Historical/participation roster pull** (`club-stats/{team}/{season}/{gameType}`, already flagged in the "`/v1/roster/{team}/{season}` answers contracts, not participation" entry above as the fix for historical *roster* membership) would need to be built as a new ingestion path, and its field shape is unverified. **Self-healing in `UpsertGameStats`** — on a miss, fetch `NhlClient#player_landing` (`/v1/player/{id}/landing`, not yet wired up) to create a real, fully-populated `Player` on the spot, and also upsert a `RosterSpot` for `(player, team, season)` using the team/season already known from the game/boxscore context. Chose self-healing: it's a smaller build, and it turns out to cover both cases the historical pull would — a player who dressed for even one game generates a boxscore row, which is exactly what triggers the self-heal. `RosterSpot::CONTRACT_LEVELS[:unknown]` (`0`, defined but never actually used by any existing sync) and `contract_level_inferred` (already exists, currently only ever set `false` by `SyncTeamRoster`) are the right fields for this — a boxscore-discovered player is precisely the case those were shaped for, they just hadn't had a writer yet. `RosterSpot::SOURCES` will need a fourth value, since `nhl_api`/`hockeytech`/`manual` don't honestly describe "inferred from a stat line, not a roster feed."

What self-healing does **not** cover, and the reason the historical pull isn't fully off the table forever: a player rostered all season but never dressed for a single game (a season-long healthy scratch or injury) never appears in any boxscore, so nothing ever triggers the self-heal for him. That's a roster-*completeness* gap, not a stats-*capture* gap, and a narrower, rarer one — shelved unless zero-game roster completeness becomes an actual product need, not built speculatively now.

Implementation will also need `UpsertGameStats` to accept a `client:` (it doesn't today — only `SyncGameStats` does, and doesn't pass it down), and `missing_players` to change meaning slightly: it should report an id only when the landing lookup itself fails (e.g. a 404), not merely "wasn't already known" — the whole point is that the latter case should no longer be a miss.

### Admin sync console: kind registry served from the API; new GET /leagues/:slug/seasons
**Status:** Settled
Building the trigger form (TASK-53) surfaced two things it needed that didn't exist yet. First, TASK-49's `SyncKindRegistry` (which kind needs which scope axes) had to be known on the frontend so the form can show/hide league/season/team fields per kind — a hardcoded, hand-mirrored TS constant was the alternative, rejected because it can silently drift from the Ruby side with nothing forcing the two back in sync; a `GET /api/v1/admin/sync_kinds` endpoint instead serves `SyncRun::SYNC_KINDS` through `SyncKindRegistry.scope_axes`, so there's exactly one definition. Second, no endpoint anywhere listed a league's seasons — every existing endpoint (standings, team games) takes a season *label* as an optional param, none hands back the list a picker needs. Added `GET /api/v1/leagues/:slug/seasons` (`SeasonSerializer`, ordered newest-first) rather than a free-text season field, since a typo'd label is indistinguishable from "no season" until the create request 422s.

### Frontend data tables: @tanstack/react-table (v8), one shared DataTable component
**Status:** Settled
First third-party UI-adjacent dependency in the frontend — every other piece of UI here is hand-rolled (see the Toast decision below). Justified as a distinct case: TanStack Table is headless, owning no markup or styles, only column/sort/pagination state and row/column models — closer in kind to React Query (already a dependency) than to a styled component kit, so it doesn't compete with the hand-rolled-UI stance the same way. `DataTable` (`frontend/src/components/DataTable`) wraps `useReactTable` and owns the actual `<table>` markup once; `SkaterStatsTable`/`GoalieStatsTable` are now just column definitions, replacing two near-identical hand-rolled tables and a hand-rolled `useSortableRows` hook (deleted). Pinned to v8, not the just-released v9: v9 restructured its primary API (no `useReactTable`/`getCoreRowModel` at the top level, a `createTableHook` pattern instead) with no solid precedent to build against confidently yet; v8 is the stable, widely-documented line. v1 wires sorting only — pagination and filtering are TanStack's row models to add later, when a league-wide stats page (hundreds of rows, real filters) actually needs them, not built speculatively now. Known cost: `useReactTable`'s returned handlers aren't stable across renders, which trips `eslint-plugin-react-hooks`'s React-Compiler-readiness check (`react-hooks/incompatible-library`) on `DataTable` — a warning, not an error, and moot today since React Compiler isn't wired into the build, but worth knowing if that ever changes.

### Admin sync console: no date/game columns on SyncRun — today's date, one item per team for game-stats
**Status:** Settled
Building `AdminSyncOrchestrator` (TASK-50) surfaced two scope gaps the `SyncRun`/`SyncRunItem` schema (TASK-47) didn't cover: `SyncStandings`/`SyncDailyScores` take a `date:`, and `SyncGameStats` takes a single `game:`, but neither table has a `date` or `game_id` column. Rather than reopen the already-migrated schema, both resolve without one. Standings/daily-scores always sync `Date.current` — an admin trigger is "pull current data now," not a historical backfill, so there's nothing for a date picker to do yet. Game-stats tracks progress per team, not per game: one `SyncRunItem` means "resync every finished game this team has in the run's season," looping `SyncGameStats` internally over `Game.for_team(team).for_season(season).finished` — consistent with roster/schedule's own per-team granularity, and safe because every sync service here is already upsert-based (see "Recompute-from-source, not increment-on-insert" below). `SyncKindRegistry`'s `game_stats` scope axes reflect this orchestrator-level requirement (`[:team, :season]`), not `SyncGameStats`'s own signature (`[:game]`). Revisit if the console ever needs a real historical-date or single-game re-run — that's an actual schema addition, not a workaround.

**Amended:** live use of a real game-stats run showed "1 step" reads as no progress at all across a whole season. The item still means one row per team — no schema change — but `SyncRun#total_steps`/`current_step` for a `game_stats` item now count its actual games (`AdminSyncOrchestrator#compute_total_steps`), and `current_step_label` reports "game stats — {team} (N/M)" per game rather than per team. Cancellation is checked between games, not just between items, since one item can now span 82 of them.

### Admin sync console: one orchestrator job looping in-process, not fan-out per item
**Status:** Settled
EPIC-12 needs to turn "sync these 21 teams' rosters" into a single trackable unit with live progress, on top of the existing `SyncTeamRoster`/`SyncStandings`/etc. services and their jobs — all of which are already forced onto the single-threaded `:ingest` queue by design (see `config/queue.yml`) so `NhlClient`/`HockeyTechClient`'s self-imposed interval stays real. Two shapes were considered: one `AdminSyncOrchestratorJob` that resolves the requested scope and calls the existing service objects directly in a loop, writing progress to a `SyncRunItem` row after each; or fan-out, where the orchestrator enqueues the real per-team jobs (`SyncTeamRosterJob`, etc.) individually and each one reports its own progress via an optional `sync_run_item_id`. Chose the loop-in-process orchestrator: it adds only new code (`AdminSyncOrchestratorJob`, `SyncRun`, `SyncRunItem`) without touching any of the six existing job classes, and the `:ingest` queue already gives fan-out zero concurrency benefit — both shapes process one unit of work at a time either way. The tradeoff is resumability: if the orchestrator job itself dies mid-run, SolidQueue retries the whole job rather than just the in-flight item, so every service call it makes has to stay safely re-runnable — true today, since `SyncTeamRoster`/`SyncStandings`/etc. are all upsert-based, not append-only (see "Recompute-from-source, not increment-on-insert" above for the same property elsewhere). Rate limiting needs no new mechanism: `NhlClient`/`HockeyTechClient` already accept a `min_interval:` override in their constructors, so the admin UI's Conservative/Normal/Aggressive presets just pick which value the orchestrator passes when it builds a client for a run — no `sidekiq-throttled`-style gem, no per-job concurrency config to add. Alternatives considered: Sidekiq-style concurrency throttling (this app runs SolidQueue, not Sidekiq, and concurrency is already fixed at 1 by `:ingest`, so a concurrency knob would control nothing real).

### Monorepo (single repo for backend + frontend)
**Status:** Settled
Frontend and backend live in one repo (`backend/`, `frontend/`) for easier solo management. No shared-package tooling (Nx, Turborepo, etc.) introduced unless duplication or build coupling makes it necessary.

### Backend: Ruby on Rails, API-only
**Status:** Settled
Rails serves JSON only; no server-rendered views. React owns the entire UI.

### Database: PostgreSQL
**Status:** Settled
Default choice for Rails; no requirement pushing toward an alternative.

### Backend containerization: Docker
**Status:** Settled
Backend (and Postgres) run via Docker Compose. Frontend containerization not required for local dev — open question if a deploy target later needs it.

### Frontend: React + TypeScript + Tailwind
**Status:** Settled

### Multi-tenancy & auth model: scoped Role/Membership, custom JWT
**Status:** Settled
Public-facing, multi-tenant from the start: many leagues, each with many teams. `User` (bcrypt via `has_secure_password`) authenticates via a custom-issued JWT bearer token — not Devise, not session cookies — specifically to avoid cross-origin cookie friction between the separately-hosted Rails and React apps. Authorization comes from `Membership` rows: `user_id` + `role_id` + a polymorphic scope (`League` or `Team`). `Role` is a lookup table, not a hardcoded enum, so new roles (Head Coach, Scout, Analyst, ...) are a data insert, not a migration — chosen because the team-role list is expected to grow. League-scoped roles (`league_admin`) manage every team in their league; team-scoped roles (`gm`, `assistant_gm`, `coaching_staff`) are scoped to one team. Super Admin is a boolean flag on `User`, not a scoped role — there's exactly one, it bypasses scope checks, and it's how manual overrides (moving a player between teams, editing records directly) happen. Full detail in `ARCHITECTURE.md`. Alternatives considered: Devise+devise-jwt (more gem magic than needed for an API-only app), session cookies (cross-origin friction), a flat `role` enum on `User` (can't express "GM of team A, coaching staff on team B" or league-vs-team scope).

**Reads are not membership-scoped (2026-08-23).** `Membership`/`Role` gate *write* actions (EPIC-9: lineups, call-ups, trades, contracts) via `BaseController#authorize_team!`, not visibility. Any authenticated user can read any league, team, roster, schedule, or standings — login is required (this isn't anonymous-public yet, since every route consumes `authenticate_user!` and the frontend is the only intended client so far), but nothing is hidden between teams or leagues. `TeamsController#set_team` previously also called `authorized_for_team?`, and `League.visible_to` filtered both `LeaguesController` actions plus `LeagueGamesController`/`StandingsController` — both removed; `visible_to` deleted from `League` entirely rather than left unused. Corrects an earlier build-out that assumed reads should be scoped the same way writes are; a fully anonymous public surface is a separate, later decision.

### Team affiliate hierarchy: TeamAffiliation, one-directional visibility
**Status:** Settled
Real NHL orgs have an affiliate chain (NHL → AHL → ECHL, e.g. Ottawa Senators → Belleville Senators) and staff at the top want visibility into affiliates' data. Modeled as `TeamAffiliation`: a self-join on `Team` (`parent_team_id`, `affiliate_team_id`, `started_on`/`ended_on`) — history-preserving like `RosterEntry`, since affiliations change over time, especially at the ECHL level. Arbitrary chain depth rather than fixed NHL/AHL/ECHL columns. Visibility is one-directional: parent-club staff can read down the chain; affiliate staff do not get visibility up into the parent club. Authorization's Membership scope check must walk this chain, not just match the Team row directly. Alternatives considered: a plain `affiliate_of_id` FK on `Team` (loses history, same mistake `RosterEntry` was designed to avoid); bidirectional visibility (rejected — leaks parent-club data down to lower-tier staff and blurs the reporting relationship).

### AHL and ECHL as real League/Team rows, not just affiliate name strings
**Status:** Settled
Originally AHL/ECHL affiliates existed only as free-text names on `TeamAffiliation`/`data/nhl-teams/affiliations.json` (e.g. `ahl_affiliate: "Belleville Senators"`). Decided to instead seed AHL and ECHL as first-class `League` rows with real `Team` rows under them, same as the NHL — needed so `TeamAffiliation`'s `affiliate_team_id` can point at an actual `Team` record instead of a name string, and so AHL/ECHL teams get the same Membership/roster/stats machinery as NHL teams for free. Seed data lives in `data/ahl-teams/` and `data/echl-teams/` (32 and 30 teams respectively), structured like `data/nhl-teams/` (`teams.json` + `logos/` + `README.md`), each team's `nhl_affiliate` field cross-referencing `data/nhl-teams/affiliations.json`. Not yet wired into backend seeds — see TASK-18.

### Domain model informed by prior attempt (hockeywiz)
**Status:** Settled
A prior solo attempt at this same domain (github.com/AdamC66/hockeywiz, Django, pre-AI-assisted) was reviewed for reusable ideas and known mistakes — see `ARCHITECTURE.md`'s Domain Model section for the resulting entity list. Carried forward: team rest/fatigue as a computed signal, season as data. Carried forward as things to explicitly avoid: hardcoded season strings, a combined skater+goalie stats table, synchronous blocking external-API calls on the request path, no auth/multi-tenancy at all, secrets committed to source, no tests.

### Backend formatting: RuboCop autocorrect (omakase), not a dedicated formatter
**Status:** Settled
Ruby has no Black/Prettier equivalent with real consensus, so RuboCop's safe autocorrect (`bin/rubocop -a`) is the formatter. The `rubocop-rails-omakase` preset was already in the Gemfile and is itself the Black pitch for Rails — a fixed house style you're not meant to configure. `-A` (unsafe autocorrect) is deliberately never used anywhere: it can change behavior, which no real formatter does. Wired into the existing `frontend/.husky/pre-commit` as a second stage — staged Ruby files get `rubocop -a --force-exclusion`, corrections are re-staged, and an uncorrectable offense aborts the commit. Alternatives considered: `rubyfmt` and `syntax_tree`, which are the true reprint-from-AST analogues of Black (rubyfmt now Prism-based) — rejected because either would run *alongside* RuboCop and fight it over `Layout/*` cops, meaning disabled cops and two tools to explain, for a formatting outcome omakase already provides. Revisit if a Prism-based formatter ever consolidates the ecosystem the way Black did for Python.

### Local Ruby 3.4.10 via mise, alongside Docker
**Status:** Settled
`backend/.mise.toml` pins Ruby 3.4.10, replacing the earlier "don't assume a local Ruby install" stance in `backend/CLAUDE.md`. Two reasons converged: the `Makefile` local-dev flow runs Rails and Vite natively with only Postgres in Docker, and a pre-commit hook that shells into a container costs seconds per commit and hard-fails when the daemon is down — which is how hooks end up routinely bypassed with `--no-verify`. The fully-dockerized path (`docker compose up`, `Dockerfile.dev`) still exists and still works; it's just no longer the default for day-to-day work. mise was chosen because it was already installed — nothing here depends on it specifically, and the hook falls back to whatever `ruby` is on PATH.

### Frontend formatting & pre-commit hooks: Prettier + husky + lint-staged
**Status:** Settled
Prettier owns formatting; ESLint owns correctness. `eslint-config-prettier` is extended last in the flat config so the two never fight over a stylistic rule. Prettier runs on defaults (semicolons, double quotes) with only `printWidth: 100` overridden — the zero-config baseline, at the cost of one reformatting pass over the Vite scaffold. Hooks are husky-driven and live at `frontend/.husky/` rather than the repo root, so no Node `package.json` has to exist at the root of a repo whose root isn't a Node project; `prepare` runs `cd .. && husky frontend/.husky` (husky's documented recipe for a package outside the git root) and the hook `cd frontend`s before invoking lint-staged, since git runs hooks from the repo root. Backend hooks (rubocop/rspec), when wanted, get appended to that same `pre-commit` file. lint-staged runs `eslint --fix` then `prettier --write` on staged `.ts`/`.tsx`, and `prettier --write` alone on other staged file types; an unfixable lint error aborts the commit. Alternatives considered: a root `package.json` owning the hooks (more conventional monorepo shape, rejected to keep Node tooling contained in `frontend/`), and `simple-git-hooks` (lighter than husky, but husky is the better-documented default for someone new to this toolchain).

### Node version: 26 (pinned via frontend/.nvmrc)
**Status:** Settled
Matches the machine's `nvm alias default`, so the pin and the ambient shell agree — a mismatch is how hooks end up running under a different Node than the terminal. A modern major is required regardless: Vite 8 needs `^20.19 || >=22.12`, lint-staged 17 needs `>=22.22`, and ESLint 10 crashes on `util.styleText` when *printing* violations under Node < 20.12, turning a useful lint failure into a stack trace. Pinned to major `26` so nvm resolves the latest installed patch. Note 26 is Current, not yet LTS (LTS ~Oct 2026) — fine for a portfolio project; revisit if a deploy target demands LTS. Known cost of being on Current: Node 26 ships an experimental global `localStorage` that shadows jsdom's and needs `--localstorage-file`, so `frontend/src/test-setup.ts` polyfills it for tests.

### Frontend import convention: absolute, except tests
**Status:** Settled
All component/hook/feature imports use the `@/` absolute alias, never relative parent traversal. Exception: a test file importing its own subject uses a relative import, so the test stays adjacent to the component through folder moves (e.g. a component promoted from a feature folder into shared `components/`). Component file itself is still never named `index.tsx` (see `frontend/CLAUDE.md`).

### Testing approach: smoke tests, no coverage gate
**Status:** Settled
Portfolio project — 1-2 tests per unit (happy path, plus a real edge case when one exists), not exhaustive coverage. No coverage tooling/gate. Shared test setup (factories, shared_examples, custom render/mock layer) abstracted into one place per stack so individual test files stay thin. See `TESTING.md`.

### Frontend bundler: Vite
**Status:** Settled
Vite, as the earlier lean suggested. Nothing in the dashboard needs SSR or SEO, so Next's routing/rendering story bought nothing that justified the extra framework surface. Revisit only if a concrete requirement (auth-gated SSR, server data fetching, image optimization at scale) appears.

### API response/error envelope shape
**Status:** Settled
Success responses wrap in `data`, with `meta` reserved for pagination and similar: `{ "data": {...}, "meta": {...} }`. Errors always take one shape with a machine-readable code: `{ "error": { "code": "invalid_credentials", "message": "...", "details": {...} } }`. `details` and `meta` are omitted when empty rather than sent as null. Enforced through the `ApiResponses` controller concern (`render_data` / `render_error`) so no controller hand-rolls a payload, and unwrapped in exactly one place on the client (`src/lib/apiClient.ts`), which is what makes every react-query hook typed the same way. Alternatives considered: flat top-level resources (less ceremony, but pagination metadata then has nowhere to live except headers) and full JSON:API (solves problems a solo dashboard doesn't have yet, and needs a serializer gem).

### Frontend state management: TanStack React Query
**Status:** Settled
Server state lives in React Query; React state covers only local UI concerns (form fields, menu open/closed). No Redux/Zustand — there is no meaningful client-owned state to justify one, and the identity that *is* app-wide is exposed through a context reading from a React Query cache entry rather than duplicating it. Query defaults: `retry: 1` and `refetchOnWindowFocus: false`, because a 401 or 422 will not fix itself on retry and aggressive refetching is noise on a dashboard.

### Error/success notifications: hand-rolled Toast, not react-hot-toast
**Status:** Settled
Mutations (call-ups, roster status changes) had no visible failure path — a rejected `useMutation` just failed silently, forcing a check of the network tab to see why an action didn't take. `react-hot-toast` was the initial suggestion; decided against it in favor of a small hand-rolled `ToastProvider`/`useToast`/`ToastViewport` (same split as `src/auth/`) because every other piece of UI in this app — `Dialog`, `Card`, `Button`, `SegmentedControl` — is already hand-rolled with zero third-party UI dependencies, and a toast stack (a positioned list, an auto-dismiss timer, a dismiss button) isn't enough code to justify being the first exception. `useSendPlayerDown`/`useCallPlayerUp`/`useSetRosterStatus` now call `showToast(toErrorMessage(error), "error")` from `onError`; success toasts weren't added since the immediate need was specifically errors going unseen.

### Auth session: jti denylist for real logout, token in localStorage
**Status:** Settled
Logout genuinely revokes. Each JWT carries a `jti`; `DELETE /api/v1/logout` records it in `revoked_tokens` and `authenticate_user!` rejects any token whose jti is listed. The cost is a DB lookup per authenticated request plus `PurgeRevokedTokensJob` (daily, via `recurring.yml`) to drop rows past their `expires_at`. A no-op logout endpoint was considered and rejected: an endpoint implying revocation without performing it is a trap for whoever relies on it later.

The client stores the token in `localStorage` under `backcheck_auth_token`, so a refresh or new tab stays signed in and identity can hydrate synchronously on boot. **This is XSS-readable — the accepted tradeoff.** In-memory-only storage was the alternative; it needs a refresh-token flow over an httpOnly cookie, which reintroduces exactly the cross-origin cookie friction that motivated header-based JWT in the first place. Every access is wrapped in try/catch because `localStorage` throws outright (not returns null) in some privacy modes.

### Frontend routing: react-router, guards own redirects
**Status:** Settled
`react-router` from the start — a dashboard covering rosters, games, and teams needs real URLs immediately, and retrofitting routing onto components that assume conditional rendering is the expensive version of this work.

Both directions of the auth redirect are route guards, not page logic: `RequireAuth` keeps anonymous users out of the app, `RedirectIfAuthenticated` keeps signed-in users off `/login` — and because logging in populates the user, that same guard performs the post-login redirect, so `LoginPage` never calls `navigate()` itself. Both render a loading state while a stored token is still being verified rather than acting on a not-yet-known answer; without that, a refresh either flashes the login form or bounces a valid session to `/login`. `RequireAuth` stashes the attempted path in location state so a deep link survives the login detour, and `returnPathFrom` narrows it back to an in-app path — an unchecked value there would be an open redirect.

### CORS: any localhost port in dev, explicit origins in deployment
**Status:** Settled
`FRONTEND_ORIGIN` (comma-separated) names allowed origins; with it unset, local dev accepts any `localhost`/`127.0.0.1` port and deployed environments allow nothing and log a warning. The dev looseness is deliberate: Vite silently moves to `:5174` when `:5173` is taken, and the resulting failure surfaces in the browser as an unexplained CORS error rather than anything pointing at the port. `strictPort` in `vite.config.ts` attacks the same problem from the other side, making the drift fail loudly instead. Worth remembering that a 500 from an exception can also present as a CORS error, since the error response may not carry the ACAO header — check the Rails log before assuming the origin config is at fault.

### Project name: Backcheck
**Status:** Settled
"Backcheck" — a hockey term (tracking back defensively) that doubles as a data verb, which is the whole point of the portmanteau. Replaces the working title "Hockey Analytics Dashboard" and the older `hockeywiz` attempt. Deliberately not in the `Puck*` namespace, which is crowded (PuckPedia, Puckalytics, PuckPulse, PuckStats, PuckRank), and deliberately not cap-flavored — CapFriendly/PuckPedia/General Fanager are contract sites, this is hockey ops. Known collision: BackCheck was Canada's leading background-screening firm, acquired by Sterling in 2012; different Nice class and different buyer, and Sterling has been retiring the name, so it's a yellow flag only if this is ever commercialized. `backcheck.hockey` is the intended domain — the TLD does the disambiguating. The repo directory is still `hockey-analytics-dashboard`; renaming it is a separate step, and `ARCHITECTURE.md`'s layout tree tracks the real directory name until then.

### League branding columns, and where logo files live
**Status:** Settled
`leagues` carries `abbreviation` (unique), `tier`, and `logo` alongside name/slug. `tier` is an integer rank in the affiliation hierarchy (NHL 1, AHL 2, ECHL 3) rather than a display-order column: it's the same fact the NHL→AHL→ECHL chain in `data/` already encodes, so `TeamAffiliation` can validate against it later, and sorting by it falls out for free. Ordering in the frontend was the alternative — rejected because a hardcoded league order in a component is a fact about the sport living in the view layer.

**Superseded on the logo column** — see "Logo storage: Active Storage" below. `leagues.logo`/`teams.logo` originally held a bare file name resolved against `frontend/public/`; both columns are gone.

### Frontend layout: containers / components / models
**Status:** Settled
Replaces the `features/` + `api/` + `types/` layout. `containers/` holds pages and anything stateful or data-fetching; `components/` is strictly presentational; `models/` is the data layer (request functions, React Query hooks, payload types) organized by domain rather than by feature. The old split put a feature's UI, hooks, and fetchers in one folder, which reads well until two features want the same data and the fetcher has to live in someone's folder.

Two mechanical constraints fell out of it, both worth keeping:
- Request functions and their hooks are separate modules (`models/leagues.ts` / `models/useLeagues.ts`). When both live in one file, a hook's call to its own module's request function goes through an internal binding that `vi.mock` of that module cannot intercept — the test mocks the fetcher and the real one runs anyway.
- Query keys live in `models/queryKeys.ts`, apart from request functions. Vitest's auto-mock empties exported arrays, so a key defined beside a mocked fetcher becomes `[]` — and once two keys are both `[]`, the queries collide in the cache and one query's data shows up as another's. That failure presents as a nonsense type error far from the cause.

Auth is the one exception to the split: provider, context, `useAuth`, and both route guards stay together in `src/auth/`. Identity is cross-cutting, and scattering six small files across three folders to satisfy the rule made it harder to follow, not easier. `api/client.ts` became `lib/apiClient.ts` — it's infrastructure the models are built on, not a model.

### Team branding columns; no city column
**Status:** Settled
Colors are three nullable `#RRGGBB` columns (`primary_color`, `secondary_color`, `tertiary_color`), not a `jsonb` blob. The set is fixed and known, validation is a plain format check, and a jsonb column would let key names drift with nothing enforcing the shape the frontend reads. Seven NHL teams have no tertiary; AHL and ECHL have no colors collected yet — all null, which is the same nullable case either way.

`teams.city` was dropped rather than populated. The manifests only carry full names, and splitting them needs hand-correction for every multi-word nickname (Golden Knights, Maple Leafs, Swamp Rabbits) and multi-word city (Wilkes-Barre/Scranton, Coachella Valley). When location genuinely matters it'll be a real model — arena, timezone for rest calculations — not a string carved out of the team name.

`abbreviation` is unique *within a league*, not globally: CGY is both the Calgary Flames and the Calgary Wranglers.

Seeding reads `data/` directly (`Rails.root/../data`) instead of copying manifests into `backend/`, so there's one source of truth for the raw data. The dockerized backend mounts `./data:/data:ro` for this — its build context is `./backend`, so nothing above it exists in the container otherwise.

### Logo storage: Active Storage, Disk now and S3-compatible later
**Status:** Settled
League and team logos are Active Storage attachments (`has_one_attached :logo`), not files shipped in `frontend/public/`. The old arrangement made a logo change a frontend redeploy, which is wrong for data that belongs to the domain — teams rebrand, leagues gain and lose franchises. Copies under `frontend/public/{leagues,teams}/` were deleted and the `logo` filename columns dropped (they'd also have collided with the `logo` reader the attachment defines).

Worth being precise about what this means, coming from Django: Active Storage is `FileField` + django-storages, not bytes in Postgres. Metadata goes in `active_storage_blobs` / `active_storage_attachments`; the bytes go to a *service* configured per environment in `config/storage.yml` — `Disk` today, S3/GCS/Azure by changing one line, with no application code affected. `data/` remains the source of truth for seeding; the storage service is the runtime store.

Details that were decided rather than defaulted:
- **Proxy URLs, not redirect URLs.** `rails_storage_proxy_url` returns a stable, CDN-cacheable URL the app streams. The default redirect URL hands out a signed service URL that can expire while sitting inside an already-cached JSON response.
- **SVG is served inline.** Active Storage forces SVG to download by default, because an inline SVG can carry `<script>` — real, but it also means `<img src>` renders nothing. The exception is safe here: this origin holds no credentials (auth is a bearer token the frontend keeps) and only the seeds can write a blob. **When an upload endpoint lands, that reasoning expires** — sanitize SVG on the way in, or rasterize and restore the default.
- **`Rails.application.routes.default_url_options`** is set in `config/initializers/default_url_options.rb` (`APP_HOST`/`APP_PROTOCOL` in production). Absolute URLs are built outside any request, and without a host the first serialized logo 500s.
- **Attachment is checksum-guarded** (`AttachLogo`). Re-attaching on every seed run would replace each blob and orphan the old one; comparing Active Storage's base64-MD5 makes a rerun a no-op.
- **Variants are not used.** 94 logos at ~10-20KB need no resizing, and variants would put libvips in the Docker image. (The boot-time "vips not installed" warning is that unused default announcing itself.)
- **N+1** is handled by a `with_logo` scope (`includes(logo_attachment: :blob)`) on both models — serializing 32 teams is otherwise 32 extra queries.

Deployment still points at `Disk`; a mounted volume keeps `backend/storage/` across restarts. Switching to S3/R2 means adding `aws-sdk-s3`, a service block, and changing `config.active_storage.service` — deliberately deferred until there's somewhere to deploy.

### Authorization enforcement mechanism
**Status:** Open
The data model (Role/Membership/scope) is settled; how it's enforced in controllers — hand-rolled scope checks vs. a policy-object gem (e.g. Pundit) — is left until the backend exists.

### External stats data source: the NHL's public web API
**Status:** Settled
`api-web.nhle.com` (the endpoints catalogued in [Zmalski/NHL-API-Reference](https://github.com/Zmalski/NHL-API-Reference)) — undocumented but public, free, and the source of truth for the data it serves. Replaces the dead `statsapi.web.nhl.com` the prior attempt used. Manual entry and CSV import were the alternatives; both are worse versions of the same data, and neither survives a nightly refresh.

The API publishes **no rate limit and returns no rate-limit headers** — it's Cloudflare-fronted with a ~14s cache. That means politeness is entirely self-imposed, so ingestion is throttled by construction rather than by observation:
- `NhlClient` enforces a minimum interval between requests (default 1s, `NHL_API_MIN_INTERVAL`), tracked with a monotonic clock on a process-wide mutex so separate services can't each keep a private interval and collectively burst.
- Every ingestion job runs `queue_as :ingest`, and `config/queue.yml` gives that queue **one thread in one process**. Queues are now listed explicitly instead of `"*"`, because a wildcard worker would run three syncs in parallel and turn one request per second into three. A new queue needs adding there or nothing runs it.
- Retries are capped at 3 with exponential backoff on 429/5xx/timeouts. A 404 doesn't retry — a season that doesn't exist won't start existing.

Nothing calls the client from a request. Data lands via jobs (`SyncStandingsJob`, `SyncDailyScoresJob`, `SyncTeamScheduleJob`), which is the explicit correction of the prior attempt's "if the data is older than six hours, go fetch it" inside a resolver.

**Historical vs. daily.** Backfill is a rake task (`rake 'nhl:backfill[20242025,20252026]'`), currently the two most recent seasons; widening it is a re-run, not a code change. Daily syncs are two `recurring.yml` entries at 9am UTC (~5am Eastern, late enough that West Coast games are final): standings and scores for yesterday. Three requests a day.

Every write is an upsert on a natural key (`nhl_game_id`; `team + season + as_of_date`), so re-running anything is safe.

### Standings as dated snapshots
**Status:** Settled
`team_standings` is keyed `(team, season, as_of_date)` — one row per team per day, not one row overwritten in place as the prior attempt did. It makes "where did the wildcard race stand in January" answerable and matches how the upstream `/v1/standings/{date}` endpoint thinks. Cost is ~5,700 rows per season, which is nothing.

Completed seasons get a single end-of-season snapshot rather than a day-by-day backfill (1 request instead of ~180); the live season accumulates dailies from here on. `as_of_date` is taken from the payload rather than the requested date, which has a useful side effect: an offseason sync returns the final standings still dated to the end of the season, so it updates the existing rows instead of inventing a new snapshot every quiet day.

We store ~30 of the 82 fields per team. The omitted ones are percentages and per-split sequences that are derivable or unused; because each sync re-reads the whole payload, adding one back later is a migration, not a re-fetch.

### webmock in the test group
**Status:** Settled
Real HTTP is disabled in every spec (`WebMock.disable_net_connect!(allow_localhost: true)`), so an NHL sync spec can't quietly depend on the live API or hammer it in a loop. Fixtures in `spec/fixtures/files/nhl/` are trimmed recordings of real payloads — kept small by dropping teams and games, never by editing fields, so the shapes stay honest. VCR was the alternative and is more machine than this needs when four endpoints are involved.

### Rosters need a second upstream: HockeyTech for the AHL and ECHL
**Status:** Settled
The NHL API alone can't answer the question rosters exist to answer. `/v1/roster/{abbrev}/current` returns the whole organization on NHL contracts — 49 players for Toronto, 27F/18D/4G — with no indication of who is in the NHL and who is in Utica. It carries no assignment, no contract, no transaction history. (It also 307s, so the client must follow redirects; `current` resolved to `20262027`.)

The AHL and ECHL both run on HockeyTech/LeagueStat, and their feed keys are public in the statview bundle each league's own site loads (`lscluster.hockeytech.com/statview-1.4.1/js/client/{ahl,echl}/base.r3.js`): `ahl` / `ccb91f29d6744675` and `echl` / `2c2b89ea7345cae8`. `feed=modulekit&view=roster&team_id=&season_id=` returns a full roster with birthdate, jersey, position and structured `draftinfo`.

What makes it worth the second client is the AHL feed's **`status` field — `NHL` / `AHL` / `PTO` / `ATO`**. That is the distinction the whole feature rests on: the 2025-26 Marlies were 26 players on Leafs contracts, 15 on AHL-only deals, 6 pro tryouts and 3 amateur tryouts. Without it, a Leafs prospect on assignment and a career AHLer are the same row.

Three asymmetries between the two tiers, all of which the ingestion has to expect:
- **The ECHL feed leaves `status` empty** — all 51 Cyclones, and only 6 of them have `draft_status` at all. Contract level at the ECHL tier is inherited by cross-referencing the AHL roster, not read. Ten players appear on both the 2025-26 Marlies and Cyclones rosters, one of them (Kressler) `status=NHL` — an NHL contract playing two tiers down, which is exactly the case worth modelling.
- **The current season's roster is empty until camp.** AHL `season_id=94` (2026-27) returns nothing while `90` (2025-26) returns 50. Syncs fall back to the newest season that actually has a roster, in the same spirit as `as_of_date` coming from the standings payload.
- **HockeyTech carries no NHL player id.** Matching is normalised name plus birthdate, with unmatched players *reported* the way `SyncStandings` reports `missing_teams` rather than dropped. Birthdate makes it tractable; names alone would not — the NHL says `Bo Groulx`, the AHL says `Benoit-Olivier Groulx`. Fuzzy surname matching was rejected as confidently wrong more often than it is usefully right.

  Normalising to ASCII is not optional, and not only for the second source: the NHL API is inconsistent with its *own* diacritics. One 2024-25 roster payload contains `David Kampf` and `Jani Hakanpää` a few lines apart, while the AHL feed spells the former `David Kämpf`.

`/v1/player/{id}/landing` stays useful as a third read: `seasonTotals` is cross-league (AHL, ECHL, KHL, NCAA, OHL) with team names, and `currentTeamAbbrev` holds the NHL club even for a player with no contract — Chebykin reads `TOR` while playing for Severstal. That is the retained-rights signal.

### Players are global; rosters are a join
**Status:** Settled
One `players` row per human, never per player-per-team. A player who splits a season between the Maple Leafs and the Marlies is one person, and a trade must not fork him into two. `players` holds identity and biography only — no team foreign key, no salary.

Where he played is `roster_spots`: `(player, team, season, status, jersey_number)`, one row per player-team-season, which is what lets the same human appear on all three tiers in one year.

`roster_spots.status` is **source-reported, not authoritative** — it is what the AHL feed said, and nothing should compute off it. It is a proxy for a contract fact (a two-way deal, and an assignment under it) that we do not yet hold. When real contract data lands, the authority moves and `status` stays as provenance.

`nhl_player_id` sits denormalised on `players` as the canonical spine — it is the tier-1 source, and it appears in serializers. Every *other* source's id goes in `player_external_ids` (`source`, `external_id`, `matched_by`), unique on `(source, external_id)`. This is deliberately different from the per-source columns chosen for teams and seasons, and the reason is contracts (below): a third and fourth source are coming, and unlike 32 teams, player identity is reconciled by fuzzy match — so the mapping needs somewhere to record *how* a match was made and whether a human confirmed it. A column can hold the answer but not its provenance, so every re-sync would re-guess. The join cost is not real for ingestion, which loads one source's whole map in a single query.

`teams` and `seasons` get plain `hockeytech_team_id` / `hockeytech_season_id` columns alongside the `nhl_*` ones. Those sets are small, stable and hand-verifiable (Marlies are `335`, AHL 2025-26 is `90`), and folding the working `nhl_*` ingestion into a generic table buys nothing.

Both are indexed **unique per league**, not globally the way `nhl_team_id` is: nothing upstream promises the AHL and ECHL number their teams and seasons in different ranges, and they visibly overlap in size (Cincinnati is ECHL team `5`, Abbotsford is AHL team `440`). Postgres treats nulls as distinct, so the constraint costs nothing on the NHL rows that will never carry one.

Draft details ride along on `players` — `draft_year`, `draft_round`, `draft_overall`, plus `draft_team_name` **and** a nullable `draft_team` reference. Both upstreams send this structured and free, so collecting it now is cheaper than backfilling later. The name is the stored truth because a drafting franchise may predate a relocation and have no `teams` row at all; a hard reference alone would either drop those picks or demand every defunct franchise be seeded.

Affiliations are a `team_affiliations` table (NHL team, minor team, season), not a self-referencing column on `teams`. A single parent column can't express Toronto, which has a Marlies affiliation *and* a Cyclones one at a different tier — and affiliations genuinely move between clubs, so the season key keeps history correct rather than rewriting it. Unique on `(affiliate_team, season)`, not `(parent_team, affiliate_team, season)`: the real invariant is that one AHL or ECHL club has exactly one NHL parent at a time, not that a parent has exactly one affiliate — that's the row that lets Toronto hold two.

**Seeding a season-keyed table from a season-less manifest** turned out to need its own answer. `data/{ahl,echl}-teams/teams.json` carries one `nhl_affiliate` per team — current, not historical — and `db:seed` creates leagues and teams before any `Season` row exists (seasons come from `rake nhl:backfill`, run separately). `ImportTeamAffiliations` resolves this by keying to the **newest NHL season on hand**, not `Season.current`: that scope is deliberately empty between seasons (its own comment says so), and today falls in that gap, which would have made affiliations silently fail to seed all summer even right after a backfill. It skips and reports — same shape as `missing_logos` — when no NHL season exists at all, which is the ordinary state of a freshly cloned repo before its first backfill.

### Contract data: deferred, but the schema is shaped for it
**Status:** Open
Year-by-year salary, contract type, signing bonuses and cap hits are wanted eventually. Nothing is built now, and the reason is supply, not appetite: **no free or official source exists.** The NHL API has zero contract data; PuckPedia, CapWages and Spotrac are scrape-or-license. Recording it here so the roster work doesn't have to be unwound when a source is chosen.

The shape it points at is orthogonal to `roster_spots` — `contracts` (player, team, signed_on, expires_after_season, contract_type, two_way, total_value, clauses) and `contract_years` (contract, season, base_salary, signing_bonus, performance_bonus, cap_hit, minors_salary). One says who paid him, the other says where he played, and neither needs the other to be correct. `contract_years.minors_salary` is the field that will properly state what the AHL feed's `status=NHL` currently only implies.

Two consequences already banked: `players` is a pure identity table (a player-per-team model would have been fatal, since a contract spans seasons and survives trades), and player ids are mapped through a table rather than a column, because a contract source arrives with its own id namespace and no `nhl_player_id`.

**Research pass (2026-08-23, against the source 2013 NHL-NHLPA CBA in `data/`)**, prompted by scoping lineups (EPIC-9) and needing to know what they'd eventually have to respect. Confirms the schema needs a third layer, not just the two above:

- **Article 16** (rosters): 23-man Active Roster max, min 18 skaters + 2 goaltenders. Injured Reserve and Non-Roster players don't count against the 23, but their salary still counts against the cap. So roster membership and cap-relevant status are two different facts about a player on a given day, neither of which `roster_spots` (season-grained) currently carries.
- **Article 50.5** (Team Payroll Range): "Averaged Club Salary" is **calculated daily** — a per-day sum of whoever's rostered (plus IR/non-roster) that day, with a two-way player's NHL cap hit prorated by the fraction of the season actually spent on the NHL roster. This is the mechanism behind cap space "accumulating": a player who spends half the year in the minors only charges half a season's hit. Not a static season total — a running day-by-day computation.
- **Article 50.10** (LTIR): a narrow exception to the Upper Limit for a bona-fide long-term injury — replacement salary capped at the injured player's own salary, and the club must be back under the cap before he returns.
- **Article 13** (waivers): call-ups/send-downs aren't always a unilateral GM action. Young/inexperienced players are waiver-exempt and move NHL↔AHL freely; past a games/age threshold, sending a player down requires clearing Regular Waivers, where other clubs can claim him.
- **Article 50.4** (contract limit): an NHL club carries at most 50 Standard Player Contracts at a time. Contract *type* also gates eligibility, not just where a player currently sits: an AHL-only or ECHL-only deal can't be called up to the NHL and doesn't count against that 50 — only an actual two-way/NHL SPC does. So call-up/send-down legality is a fact about the *contract*, not derivable from `roster_spots` alone — another reason TASK-37 correctly stays "eligible if you're the player's current team" until EPIC-10 lands.

None of this is buildable without contract data, and that's still correctly deferred. The actionable answer is **layering, sequenced**, so later work doesn't force a redesign of what ships now:

1. **Team assignment** — exists today, `roster_spots.team_id` per season.
2. **Active roster status** (active / injured reserve / non-roster, day-scoped) — not built. Needed to make lineup-eligibility and, later, cap accounting correct. Tracked as TASK-40.
3. **Contract + cap compliance** (Averaged Club Salary, Team Payroll Range, LTIR, waiver-exemption tracking) — not built, explicitly parked. Tracked as its own epic, EPIC-10, so it stays visibly deferred rather than implied by TASK-39's simple "register a contract" action.

v1 of lineups (TASK-35/36) and call-ups (TASK-37) gate on #1 alone — "eligible if you're the player's current team" — which is what already exists via `roster_spots`. That's a known simplification, not an oversight: #2 and #3 are real gaps in CBA-correctness, but the schema shape above doesn't box either out later.

`ReassignPlayer` (TASK-37) also overwrites `roster_spots.team_id`/`season_id` in place rather than preserving a trail of the move — considered adding a minimal move-log table alongside it (2026-08-24) so daily cap-hit accounting (Article 50.5) would have raw history to consume once it exists, decided against for now: it's the same "no CBA-correctness work until contract data exists" deferral as #3 above, just recorded earlier. Moves made before EPIC-11 (unified transaction log) ships are unrecoverable history — an accepted gap, not an oversight.

**Known rough edge (2026-08-24): stale 2025-26 affiliate data can still spuriously block a send-down.** Building TASK-37 surfaced that this dev environment has real season drift — NHL rosters already synced against 2026-27, while `team_affiliations` and the AHL/ECHL feeds are still on 2025-26 (nothing has re-run `SyncAffiliateRoster`/`ImportTeamAffiliations` for the new season yet). Two real bugs from this got fixed: `TeamAffiliation.current_for` and `Season.overlapping` (both anchor to the season data actually exists for, not "the league's newest season row"), and `TeamRoster` excluding `contract_level: nhl` affiliate-side rows from the assignment lookup (that value means "currently up with the parent club," not "playing here" — conflating the two had Anthony Stolarz reading as assigned to the Marlies). One symptom remains and is deliberately not coded around: `ReassignPlayer`'s destination-conflict check can still reject a real send-down against a stale `nhl`-tagged row left over from 2025-26. Decided to leave this rather than add tolerance logic for it — the actual fix is re-running the affiliate sync/import for 2026-27, which realigns all three mechanisms at once rather than patching each one around last year's data.

### `/v1/roster/{team}/{season}` answers contracts, not participation
**Status:** Settled
It is a **contract list of unpredictable completeness**, and that makes it the wrong source for a historical roster even though nothing in it is inaccurate.

| Season | endpoint returns | actually played | played but absent | still under contract |
| --- | --- | --- | --- | --- |
| 2023-24 | 26 | 33 | 13 | 8 |
| 2024-25 | 42 | 36 | 5 | 18 |
| 2025-26 | 18 | 38 | 22 | 18 (all of them) |

The season key is a **contract year, July 1 to June 30** — not a schedule. So Emil Andrae and Darren Raddysh correctly appear on the 2025-26 roster having played zero games for Toronto: they were acquired by trade after the season ended and signed before contracts expired on July 1. Reading the endpoint as "who played that season" is the mistake, not the data.

The problem is the other direction, and it is not a rule we can reason around. Everyone absent from 2023-24 left via UFA, trade or retirement — Bertuzzi (80 GP), Brodie (78), Gregor (63), Giordano (46, retired), Samsonov (40), Klingberg, Edmundson, Minten — which looks like retroactive removal until you check 2024-25, which **keeps** 24 departed players including Marner (81 GP), who left as a UFA exactly the way Bertuzzi did a year earlier. Its own five absentees (Timmins, Dewar, Minten, Grebenkin, Liljegren) were all traded mid-season. Meanwhile 2025-26 holds only currently-signed players and is an exact subset of `roster/current`. Three seasons, three different completeness rules, none of them documented.

So: `/v1/roster/{team}/current` for the live organization, and **`club-stats/{team}/{season}/{gameType}` for historical membership** — participation is a fact that doesn't erode when a contract ends. Game types 2 and 3 are separate calls; a playoff-only call-up is invisible if you fetch only the regular season.

The corollary matters for `roster_spots`: a past season's rows must be *written once from participation data and then left alone*. Re-syncing a past season off the roster endpoint would silently delete players from history as their contracts lapse.

### Retained rights are not cleanly available
**Status:** Open
"NHL teams hold rights to players not under contract" has no single endpoint. `/v1/prospects/{team}` returns 4 players for Toronto, all of them in the KHL — it is effectively drafted-and-unsigned-abroad, not a rights list, and misses the 2025 picks in the NCAA and CHL. `/v1/draft/picks/{year}/all` has those (224 picks, 6 for Toronto) but carries **no `playerId`** — only name, position and amateur club, so it needs the same name matching as HockeyTech and against players who may have no NHL id at all yet.

### Syncing rosters: redirect-following, season resolution, and player identity
**Status:** Settled
Three real gaps surfaced building `SyncTeamRoster` and `SyncAffiliateRoster` that weren't visible from the API alone.

**`NhlClient` follows redirects now — it never had to before.** `/v1/roster/{team}/current` 307s with an empty body; the resolved path (`/v1/roster/TOR/20262027`) is the only thing worth keeping from the hop, since it's the sole source for which season "current" means. `roster` gets its own `get_following_redirects`, separate from the shared `get`, so the three existing methods and their specs are untouched — this endpoint is the one exception, not a new shape every method has to support.

**The org roster can resolve to a season nobody has backfilled yet.** Live, `/v1/roster/TOR/current` already resolves to `20262027` while the dev database only held `2024-25` and `2025-26`. `SyncTeamRoster` raises `UnknownSeason` rather than guess, the same shape as `UpsertGame`'s `UnknownSeason` — Season data has one owner (`SyncSeasons`/`rake nhl:backfill`), and a sync for a different concern doesn't duplicate that logic or invent a season row with fields it can't derive.

**AHL/ECHL seasons have no owner at all, so `SyncAffiliateRoster` creates them inline.** Unlike the NHL side, nothing else in the codebase will ever populate a non-NHL `Season` row. The same `client.seasons` call already needed to find "the newest season with an actual roster" (current is empty until camp — probes up to 3 candidates, newest first) carries label/start/end dates, so the local `Season` row is find-or-created as part of that resolution rather than deferred to a service with no other caller.

**ECHL contract level is inherited from the AHL side by date-range overlap, not by id or label.** The ECHL feed never reports `status`. The two leagues key their own seasons independently and don't even format labels the same way (AHL: `"2025-26"`, ECHL: `"25-26 Reg"`), so inheritance matches the same player's AHL `roster_spot` by whether the two seasons' date ranges overlap, not by shared id or string label.

**Player identity across sources never overwrites what's already on file.** `SyncAffiliateRoster` links by `PlayerExternalId` first, then by normalized name + birthdate, and only ever fills in `position`/`shoots_catches`/name on a genuinely new record — never on an existing one, regardless of source. `SyncTeamRoster` needs none of this: the NHL org roster carries a real `nhl_player_id` on every entry.

**A live sync surfaced a real data-quality gap this design was built to catch.** Cincinnati's roster synced cleanly and reproduced the Braeden Kressler case exactly (`status: nhl`, `contract_level_inferred: true`) — but the same run also silently created a second `Player` for Rhett Parsons, because HockeyTech's own AHL and ECHL feeds disagree on his birthdate (`2003-10-10` vs `2003-08-10` — day and month swapped on one side). The matcher correctly refused to merge two people who might not be the same person; what it lacked was a way to say so. Added `possible_duplicates`, reported the same way `missing_players`/`missing_teams` already are elsewhere — a same-normalized-name, different-birthdate near miss is logged instead of silently forking an identity. Not a hypothetical: found on the first real run against real data.

A log line only lives as long as the run that wrote it, and this app has no error tracker or log aggregation to catch it later — so a near miss is also persisted, in `possible_duplicate_players` (`player_a`, `player_b`, `detail`, `resolved_at`). `player_a` is always the lower id of the pair, enforced in the model as a backstop over what the service already guarantees, so the same two players can't pick up a second row on a later rerun regardless of which one the sync discovers first. `resolved_at` stays null until a human looks at it — nothing here auto-resolves. Real alerting (something that reaches a person) was considered and deferred: this app has no mailer, Slack integration, or error tracker wired up anywhere, and building one to notify about a single edge case would be infrastructure ahead of what the app has needed so far.

### Game-level stats as source of truth; season stats as a recomputed cache
**Status:** Settled
Player stats are stored at the atomic `(player, game)` grain — `skater_game_stats` / `goalie_game_stats` (TASK-26, renamed from the originally-planned `SkaterStatLine`/`GoalieStatLine`), split the same way the CBA research above already avoids combining skater and goalie shapes into one table (a carried-forward hockeywiz mistake). `team_id` lives on the stat row itself, not inferred from `roster_spots` or from `games.home_team_id`/`away_team_id` — a player's team for a specific game is a historical fact that must not move if he's traded again later, the same reasoning `TeamAffiliation` already uses.

This makes trade/call-up correctness a query, not stored state: a player who scores 10 goals for one NHL club, gets traded, and scores 10 more for another is 20 NHL goals for the season but a separate total the moment he's sent to the AHL. That's `SUM(...) JOIN games JOIN teams WHERE player_id = X AND teams.league_id = Y AND games.season_id = Z`, grouping across however many team stints he had that season. Regular season vs. playoffs falls out of `games.game_type`, already on the table — no separate flag needed.

`skater_season_stats` / `goalie_season_stats` (TASK-44) sit on top as a read cache, keyed `(player, team, season, game_type)` — same grain as `roster_spots`, so a traded player gets one rollup row per stint and league/career totals become a second, cheap `SUM` over a handful of rows instead of over every game in a season. It exists purely for read performance (leaderboards, career totals) — recomputed, never hand-edited, never the source of truth.

**Recompute-from-source, not increment-on-insert.** The rollup row for a given `(player, team, season, game_type)` is fully re-summed from `*_game_stats` after every write to that scope, inside the same ingestion job. An incremental `+=` would drift the moment a boxscore is corrected on re-sync or backfill runs out of order — both things this codebase already does elsewhere (`UpsertGame` is upsert-based, not append-only, same reasoning as the standings-snapshot and roster-sync decisions above). The recompute is bounded by one team-stint's games (≤~82), not the whole league, so it stays cheap regardless.

**Field scope for v1 is boxscore-wide**, confirmed against a live `/v1/gamecenter/{id}/boxscore` response rather than assumed from docs (the Zmalski reference catalogues the endpoint but not its fields). Skaters: `goals`, `assists`, `points`, `plusMinus`, `pim`, `hits`, `powerPlayGoals`, `sog`, `faceoffWinningPctg`, `toi`, `shifts`, `blockedShots`, `giveaways`, `takeaways`. Goalies: shots-against and goals-against split by strength (even/PP/SH), `saves`, `shotsAgainst`, `goalsAgainst`, `toi`, `starter`, `decision`. `toi` is converted from the API's `"MM:SS"` string to integer seconds at ingestion — a season rollup needs to sum it, and you can't sum strings.

Deliberately deferred, and why:
- **Shorthanded goals/points, power-play points, game-winning/OT goals** — only on the separate per-player game-log endpoint (`/v1/player/{id}/game-log/...`), a second per-game source with a different shape (team as an abbreviation string, not an id). Not worth a second ingestion path for v1.
- **NHL Edge tracking data** (skating speed, shot speed, zone-time %, shot location/danger zone) — real advanced stats, but NHL-only (no AHL/ECHL equivalent), only exists from the 2021-22 season on, and the endpoints are season/game-type aggregates rather than a clean per-game feed. A third ingestion path, not a wider boxscore column set.
- **Corsi / Fenwick / xG** — no endpoint returns these. The play-by-play endpoint has the raw shot-event/coordinate data they're computed *from*, but deriving them means parsing play-by-play plus shift data and building a shot-attempt/xG model — a project of its own, not an ingestion widening.

**Known gap:** `faceoffWinningPctg` is stored per game exactly as the boxscore reports it, but the boxscore gives no faceoffs-taken count — only the ratio. A season rollup therefore can't correctly weight by attempts, only by games played, until a source with raw faceoff counts is found. `skater_season_stats.faceoff_winning_pctg` is a known approximation, not a true season percentage.

**AHL/ECHL stat richness via HockeyTech is unverified.** Only the roster feed's fields are confirmed so far (see "Rosters need a second upstream" above) — don't assume boxscore parity with the NHL until checked.

### Advanced-stats computation (TASK-72): missed shots, xG coordinate frame, on-ice attribution
**Status:** Settled, with a documented v1 simplification

`ComputeGameAdvancedStats` derives `player_game_advanced_stats`/`team_game_advanced_stats` from `game_events`/`shifts`. Three decisions made building it:

**Added `GameEvent::EVENT_TYPES[:missed_shot]`.** TASK-58 shipped without it (`goal, shot, faceoff, hit, giveaway, takeaway, penalty, blocked_shot`), which made Fenwick (unblocked attempts) indistinguishable from Corsi (all attempts) — there was no way to record an unblocked shot that missed the net as anything other than `shot` (on goal) or `blocked_shot`. A plain new hash value, no migration needed.

**xG is scored on Fenwick events only (goal, shot, missed_shot), never `blocked_shot`.** A blocked shot's recorded coordinates are the blocker's position, not the shooter's release point — applying the xG model there would score the wrong location.

**xG's distance/angle-to-net formula assumes `x_coord`/`y_coord` are already relative to the attacking net at `(89, 0)`.** Real NHL coordinates are absolute rink position, and which end a team defends flips by period — correctly normalizing for that needs to know each team's per-period attacking end, which nothing in this schema tracks yet (no real play-by-play has been ingested to check the convention against either — ingestion is still deferred, per EPIC-13's own scope note). Treating coordinates as pre-normalized is a known v1 simplification, not a claim that it's rink-accurate. Revisit once real ingested data exists to validate against.

**On-ice attribution is the standard team-stat definition, not shooter-only.** A Corsi-tracked event credits every skater (excluding goalies) with a `Shift` row covering that event's `period`/`period_time_seconds` — the shooting team's on-ice skaters get `_for`, the opposing on-ice skaters get `_against` — not just the event's `primary_player`.

**Known gaps, deliberately left for a later task:** `zone_entries`/`zone_exits` stay at their column default — nothing in `game_events` models a zone entry/exit, so there's nothing to derive them from yet. `toi_seconds` is only computed for the `"all"` bucket; splitting by strength_state would need a continuous strength-state timeline (when did a power play start/end) that this schema doesn't track — events carry their own strength_state, but there's no interval reconstruction between them.

### Score-state splits (TASK-64): full cross product, all four advanced-stats tables, "close" definition
**Status:** Settled

Extended `player_game_advanced_stats`/`player_season_advanced_stats`/`team_game_advanced_stats`/`team_season_advanced_stats` with a `score_state` column (`"all"`/`"close"`, `PlayerGameAdvancedStat::SCORE_STATES`), widening each table's unique index to include it. Three decisions, checked before touching schema already shipped by TASK-60/61/66/67:

**Applies to all four tables, not just the player-grain ones TASK-64's own description named.** `strength_state` already applies uniformly across player and team grain; leaving team-grain score-state out would have been an asymmetry with no real justification.

**Full cross product of strength_state × score_state**, per TASK-64's own "doubling every strength-state table" framing — every strength bucket (all/5v5/pp/sh) gets both an all-score and a close-score row, including the rare "PP + close" combination. Mechanically consistent over selectively pruning odd combinations.

**"close" = within one goal in the 1st/2nd period, tied in the 3rd, and all of overtime counts as close regardless of margin** (standard analytics convention) — evaluated using the score *entering* an event, so a goal that ties the game is itself still scored under the pre-goal (closer) state, not the game's tied.

`ComputeGameAdvancedStats` reconstructs the score entering each event by scanning `goal`-type `game_events` in `(period, period_time_seconds, id)` order — a plain in-memory scan, not a stored running total, since nothing else needs live score state and the event volume per game is small. Backfilling existing games (once real ingestion exists) is `rake advanced_stats:backfill`: a plain rake task looping `ComputeGameAdvancedStats` + `RebuildAdvancedStatsForGame` per game with stored `game_events`, no NHL API call — safe to re-run because both of those services already recompute wholesale rather than increment in place.

### Play-by-play/shift-chart endpoints (TASK-74): confirmed against live responses
**Status:** Settled

EPIC-15's ingestion work opened by pulling real play-by-play and shift-chart data for an actual game, rather than assuming shapes from third-party docs — same discipline as every other endpoint in this codebase. Findings:

**Two endpoints, two hosts.** Play-by-play (`/v1/gamecenter/{id}/play-by-play`) lives on the same host as everything else (`api-web.nhle.com`) — added directly to `NhlClient`. Shift-chart (`api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId={id}`) is a genuinely different host and REST style, so it got its own `NhlStatsClient` — same reasoning as `HockeyTechClient` being separate from `NhlClient`: duplicated throttle/retry machinery over a shared base class, matching that existing precedent.

**This resolves the xG coordinate-frame question TASK-73 only ever simplified around.** Every play-by-play event carries `homeTeamDefendingSide` (`"left"`/`"right"`), which is exactly what's needed to normalize `x_coord`/`y_coord` to "distance/angle from the attacking net" correctly — no assumption required. Folded the fix into TASK-75's parser rather than leaving it as a separate follow-up, since the parser already has to read this field to attribute zone/coordinates correctly.

**Real event types confirmed against our schema.** All 9 of `GameEvent::EVENT_TYPES` (as of TASK-72, including `missed_shot`) exist in the real feed as `typeDescKey` values (`goal`, `shot-on-goal`, `faceoff`, `hit`, `giveaway`, `takeaway`, `penalty`, `blocked-shot`, `missed-shot`). The feed also carries `period-start`/`period-end`/`stoppage`/`delayed-penalty`/`game-end` — not modeled, and don't need to be; the parser just skips them.

**One shot-type gap found:** real data includes `between-legs`, which `GameEvent::SHOT_TYPES` doesn't have. Same cheap fix as `missed_shot` — a new hash value, no migration.

**A goal can have two assists** (`assist1PlayerId`, `assist2PlayerId`), but `GameEvent` only had one `secondary_player` slot. Added `tertiary_player` (nullable, `class_name: "Player"`) specifically for a goal's second assist, rather than silently dropping it — real accuracy gap for a stat people care about.

**`situationCode`** (a 4-digit string, e.g. `"1551"` = away-goalie-in/away-skaters/home-skaters/home-goalie-in) gives precise strength-state derivation per event — including empty-net situations — rather than needing to infer it. Comparing away vs. home skater counts gives even-strength/power-play/short-handed directly; our schema's `even_strength` bucket still doesn't distinguish 5v5/4v4/3v3 (unchanged limitation from TASK-72).

**Implemented in TASK-75.** `game_events` gained `tertiary_player_id` (nullable, `class_name: "Player"`) and `home_team_defending_side` (string, `GameEvent::DEFENDING_SIDES`). `XgFormula.calculate` now takes a required `target_net_x:` — the x-position of the net a shot is aimed at, resolved by `ComputeGameAdvancedStats` per event from `home_team_defending_side` (home's own net sits on that side; the away team shoots at it, home shoots at the opposite side) — replacing the TASK-72 placeholder that assumed coordinates were pre-normalized. `UpsertGameEvents`/`UpsertShifts` are the actual parsers: natural-key upsert (`nhl_event_id`/`nhl_shift_id` scoped to `game_id`), `missing_players` reporting matching `UpsertGameStats`'s existing convention, and `UpsertShifts` filtering to `typeCode 517` (discarding the `505` goal-marker noise rows). This supersedes TASK-73 — the coordinate-frame question is answered and fixed, not just flagged for later validation.

**The shift-chart feed mixes in goal-marker noise.** Real shift rows are `typeCode 517`. `typeCode 505` rows are goal annotations (`duration: null`, `shiftNumber: 0`) duplicating what play-by-play's own `goal` events already report — the parser filters to `517` and discards `505`, the client itself doesn't filter (same "client fetches, caller filters" split as `HockeyTechClient`'s coaching-staff row).

### Wiring real ingestion into the advanced-stats pipeline (TASK-76): extended the existing sync kind
**Status:** Settled

`SyncGameEvents` closes the composition `ComputeGameAdvancedStats` (TASK-72) was deliberately left out of: `UpsertGameEvents` + `UpsertShifts`, then `ComputeGameAdvancedStats`, then `MarkGameForStatsRecompute` for one game — same shape as `SyncGameStats` composing `UpsertGameStats` + `RecomputeSeasonStats` today.

**Extended the existing admin sync console `advanced_stats` kind (TASK-65) rather than adding a second one.** That kind's per-game dispatch previously called `MarkGameForStatsRecompute` directly, which assumed `player_game_advanced_stats`/`team_game_advanced_stats` were already fresh — true only because nothing populated them yet. Now that real ingestion exists, that assumption is false, so the same kind's dispatch calls `SyncGameEvents` instead (which itself ends by calling `MarkGameForStatsRecompute`) — a strict superset of the old behavior, not a parallel mechanism a super admin would have to choose between. `AdminSyncOrchestrator` gained an `nhl_stats_client` alongside its existing `nhl_client`/`hockey_tech_client`, same `min_interval` threading.

`SyncGameEventsJob` (`queue_as :ingest`) exists alongside the service for parity with every other sync kind's standalone job (`SyncGameStatsJob`, `SyncTeamRosterJob`, etc.), even though the admin console dispatches to the service directly rather than through it — consistent with the "loop-in-process orchestrator" decision above.

### Validating the advanced-stats pipeline against a real game (TASK-77)
**Status:** Settled

Ran `SyncGameEvents` against a real, already-ingested game (`nhl_game_id 2025020003`, COL @ LAK, 2025-10-07 — chosen because it already had boxscore-sourced `SkaterGameStat` rows from an earlier sync, so there was independent data to cross-check against) rather than only the trimmed fixtures TASK-74/75's unit specs use. A placeholder `XgModel` (`v0-placeholder`, untrained coefficients) was activated first since xG computation requires one — its numbers aren't calibrated, only the pipeline's mechanics were under test here.

**Direct comparison against a public reference (Natural Stat Trick, MoneyPuck) wasn't reachable programmatically.** NST Cloudflare-blocks a plain `curl` (403); MoneyPuck detects scripted access and returns a data-license notice instead of the CSV. Both are real, deliberate anti-scraping measures, not a fixable client issue. Validated by cross-checking against data already in this app instead:

- **Goal events matched the boxscore exactly**: 5 real `goal` events parsed (4 COL / 1 LAK), matching `game.home_score`/`away_score` from an entirely separate, earlier sync (`SyncStandings`/`SyncDailyScores` never touch play-by-play at all).
- **Corsi/Fenwick/SOG nested correctly** for both teams: boxscore `shots_on_goal` (23–24) ≤ computed Fenwick (33–38) ≤ computed Corsi (49–62) — the exact relationship those stats are defined by (Corsi = Fenwick + blocked; Fenwick = SOG + missed).
- **Combined team Corsi (111) exactly equaled total attempts parsed** (5 goals + 42 shots + 24 missed + 40 blocked = 111), confirming no attempt was double-counted or dropped across the team split.
- **TOI leaders were plausible, recognizable players** (Cale Makar 23:07, Drew Doughty 22:40 — both real top-4 defensemen) with realistic ice time, not a red flag like a bottom-six forward showing 30+ minutes.
- **One missing player** (`8471685`, Anze Kopitar) was correctly reported via `missing_players` rather than silently dropped or crashing — an instance of the known, already-tracked TASK-56 gap (a player who left this dev DB's synced roster set), not a new bug.

This is documented as the validation record rather than built as an automated fixture-based spec: reproducing it as a spec would need ~40 real `Player`/`Team` factories seeded with the exact `nhl_player_id`/`nhl_team_id` values a full real game references (on-ice Corsi/Fenwick correctness depends on every relevant primary player resolving, not just the ones goal-scoring touches) — a large amount of fixture weight for a check the existing trimmed-fixture unit specs (TASK-74/75/76) already cover at the mechanics level. The real-data run proved the mechanics hold up against a game they were never tuned against.

### Team stats page advanced-stats section (TASK-79): game_type split added, plus a stats-season gap fixed
**Status:** Settled

Extended `GET /api/v1/teams/:id/stats` with an `advanced` key (`players`, `team`) alongside the existing basic skater/goalie stats, and `TeamStatsPage` with strength_state/score_state filters (`SegmentedControl`, URL-driven like the schedule page's game-type filter).

**`Team#current_stats_season` was blind to advanced stats.** It only checked `SkaterSeasonStat`/`GoalieSeasonStat` existence, so a team with advanced stats synced but no basic boxscore stats yet (a real scenario — `SyncGameEvents`/TASK-76 and `SyncGameStats` are independent admin sync kinds) would 404 on this endpoint even though advanced data existed. Widened to also check `PlayerSeasonAdvancedStat`/`TeamSeasonAdvancedStat`.

`player_season_advanced_stats` is a chain of running-total snapshots, not season totals on their own (TASK-61) — the endpoint uses a new query object, `LatestPlayerSeasonAdvancedStats`, to pick each player's most recent snapshot per (strength_state, score_state) rather than serving every chained row. `team_season_advanced_stats` needs no such step; TASK-67 already re-sums it from scratch, so there's exactly one row per split.

**Follow-up: advanced stats gained a game_type split.** Shipping this surfaced that `player_season_advanced_stats`/`team_season_advanced_stats` had no `game_type` column at all — the season chain/re-sum ran across every game in a season regardless of preseason/regular-season/playoffs, unlike `skater_season_stats`/`goalie_season_stats` which are keyed `(player, team, season, game_type)`. Added `game_type` to both tables (migrated with a one-time backfill to `regular_season`, since every row synced so far was from a regular-season game), widened their unique indexes, and added a cross-field validation on `PlayerSeasonAdvancedStat` (`game_type` must match `as_of_game.game_type` — a chain never mixes game types, same reasoning `skater_season_stats` already applies by keying a separate row per stint). `RebuildPlayerAdvancedStatsChain` now scopes chain-walking to `from_game`'s own `game_type`, and `RecomputeTeamSeasonAdvancedStats` re-sums per `(strength_state, score_state, game_type)` triple. `TeamStatsController` threads the same resolved `game_type` through both the basic and advanced queries.

This also surfaced that `TeamStatsPage` had no way to actually select preseason/playoffs at all — the page hardcoded a "regular season" label with no control, for basic stats too, not just advanced. Added a `GameType` `SegmentedControl` (preseason/regular season/playoffs) driving `useTeamStats`, which already accepted a `gameType` argument nothing was passing.

### Self-healing player identity in UpsertGameStats (TASK-56)
**Status:** Settled

Real gap found running the admin sync console against live data: `SyncTeamRoster` only ever syncs a team's *current* roster (`/v1/roster/{team}/current`), so a player who's since left every team's current roster — a departed vet, a one-game call-up — has no path back to a `Player` row once he rolls off. `UpsertGameStats#player_for` would find no match and skip the stat row forever, not just until the season rolled over.

**Fix:** on a miss, `UpsertGameStats` now calls `NhlClient#player_landing` (new client method, `/v1/player/{id}/landing`) to create a real, fully-populated `Player` on the spot — same field set `SyncTeamRoster#upsert_player` already populates (name, position, shoots_catches, height/weight, birth info), confirmed against a live response rather than assumed. It also upserts a `RosterSpot` for `(player, team, season)` using the team/season already known from the game context, tagged `contract_level: unknown` and `contract_level_inferred: true` so it reads as inferred rather than authoritative. `RosterSpot::SOURCES` gained `inferred_from_stats` — `nhl_api`/`hockeytech`/`manual` don't honestly describe "inferred from a stat line, not a roster feed."

`UpsertGameStats` now takes a required `client:` (threaded through from `SyncGameStats`, which already had one for the boxscore fetch). `missing_players` now only reports an id when the landing lookup itself 404s — a real, resolvable player no longer counts as missing just because we hadn't seen them before.

Deliberately out of scope (unchanged from the original task write-up): a full historical-roster backfill from `club-stats/{team}/{season}/{gameType}`, which would only additionally cover a player rostered all season but never dressed for a single game — self-healing can't catch that case either, since it never sees a boxscore row for him. Shelved unless zero-game roster completeness becomes a real product need.

### Goalie goals/assists are structurally unrepresentable from the boxscore (TASK-57)
**Status:** Settled

The task as originally written assumed this was a schema gap plus a boxscore-field read, mirroring how skaters' goals/assists already work. Real data disproved that assumption: pulled the actual boxscore for Alex Nedeljkovic's Jan 17, 2025 game (`nhl_game_id 2024020720`, PIT @ BUF) — the first and only goalie in NHL history with both a goal and an assist in one game, so if the boxscore ever carries this, it would be there. It doesn't: his goalie row has no `goals`/`assists` keys at all, only shot/save/decision fields. This isn't a trimmed-fixture coincidence; the boxscore endpoint structurally never reports a goalie's own point production.

**Where the data actually lives:** play-by-play already attributes arbitrary players to a `goal`-type `GameEvent`'s `primary_player`/`secondary_player`/`tertiary_player` — confirmed against the same real game, where Nedeljkovic's own goal has him as `primary_player` and his assist has him as `tertiary_player` (`assist2PlayerId`). New query object `GoalieGamePoints` counts these per (game, player).

**This makes goalie goals/assists dependent on `advanced_stats` having synced, not just `game_stats`** — a real, unavoidable consequence of `game_stats`/`advanced_stats` being independent sync kinds (same fact already noted in TASK-79). Populated from both directions so either sync order ends up correct: `UpsertGameStats#upsert_goalie` derives from whatever `game_events` already exist (0 if `advanced_stats` hasn't run yet), and a new `RecomputeGoalieGamePoints` — called at the end of `SyncGameEvents` — re-derives goals/assists for every existing `GoalieGameStat` in the game and re-triggers `RecomputeSeasonStats` for each, so a `game_stats`-then-`advanced_stats` ordering self-corrects instead of staying stuck at 0. `goalie_game_stats`/`goalie_season_stats` gained `goals`/`assists` columns (default 0); `RecomputeSeasonStats#upsert_goalie` sums them the same way skater totals already are.

Not yet exposed by any serializer (`GoalieGameStatSerializer`, `GoalieSeasonStatSerializer`, the player-detail equivalents) — the task's own scope was schema + ingestion + recompute, not the read side. A real, cheap follow-up once someone wants a goalie's point total visible anywhere.

### Per-game sync kinds run off the season's game list, not one item per team (TASK-85)
**Status:** Settled

Found running a real whole-league `advanced_stats` pull: `AdminSyncOrchestrator` fanned `game_stats`/`advanced_stats` out into one `sync_run_item` per team, and each item's `games_for(team)` matched home-or-away — so any shared game (e.g. ANA @ COL) got fully reprocessed a second time once the later team's item came up: a second network fetch, and for `advanced_stats`, a second full `RebuildAdvancedStatsForGame` pass rebuilding both teams' player chains and season rollups again. Beyond the wasted work, the second pass over an already-built chain was also the specific trigger behind real `PG::TRDeadlockDetected` failures climbing the deeper a whole-league run went (concurrent `RebuildAdvancedStatsJob`s racing on the same `player_season_advanced_stats` rows — the underlying `:async`-adapter concurrency gap is tracked separately as TASK-84).

Fixed at the root instead of patched: `SyncRunItem.team` was already optional (`standings`/`daily_scores` already run as a single `team: nil` item), and `games_for(team)` was already just a filter — `Game.for_team(team)` on top of `Game.for_season(season).finished.chronological`. So `teams_for` no longer fans `game_stats`/`advanced_stats` out per team at all; it builds exactly one item, scoped to `sync_run.team` (nil for a whole-league run). A shared game physically cannot be visited twice in one run — nothing to track or skip. `compute_total_steps` stops double-counting shared games as a side effect. The one wrinkle: the per-step progress label named the team whose "turn" it was, which breaks when `item.team` is nil — switched to naming the actual matchup (`"ANA @ COL"`) instead, for both team-scoped and whole-league runs alike, since that's more informative regardless of scope.

### RecomputeSeasonStats: one query per player instead of one per column (TASK-86)
**Status:** Settled

Confirmed live in the dev log during the first real full-season sync: `#upsert_skater` issued `rows.count` plus 13 separate `.sum`/`.average` calls — 14 round trips to Postgres over the exact same row set — and `#upsert_goalie` issued 19. Called once per player per game, so a single game cost roughly 40 players × ~15 queries ≈ 600 round trips for this step alone; across a season that's hundreds of thousands of tiny queries, a real and measurable share of why the sync was slow (see the new rule in `backend/CLAUDE.md`).

Fixed by loading each `*_game_stats` relation once (`.to_a`) and aggregating in plain Ruby instead of issuing a separate SQL aggregate per column — `sum_of`/`average_of` helpers shared by both methods. `average_of` replicates SQL `AVG`'s NULL-skipping via `filter_map` rather than treating a missing `faceoff_winning_pctg` as 0. Verified against real dev data, not just specs: re-ran the new code against an already-computed real skater and goalie season row and confirmed byte-for-byte identical output to what the old per-column SQL had produced. A query-count regression spec (`sql.active_record` notification subscriber, bounded well under where the old per-column pattern would land) guards against this creeping back.

### Memoize Player/Team lookups in UpsertGameEvents and UpsertShifts (TASK-89)
**Status:** Settled

Confirmed against real game 1947 (552 plays, 1,363 real shift rows) before touching code: only 38 distinct players and 2 distinct teams are ever involved, but `player_for`/`team_for` issued a fresh `find_by` per row with no caching — up to ~1,500 queries for events, 1,363+ for shifts, all for data that only takes 40 distinct lookups to fully resolve.

Fixed with a plain instance-level hash cache in both classes (`@players`, `@teams`), keyed on the nhl id, including caching the "not found" case (`nil`) so a persistently-unmatched id doesn't get re-queried every row either — both classes are already instantiated fresh per game, so no cross-game staleness risk. Verified two ways: a query-count regression spec in each file (`sql.active_record` subscriber, synthetic payload with a repeated player/team), and a real-data dry run against game 1947 wrapped in a rolled-back transaction — confirmed 40 `players`/`teams` queries total for each class, matching distinct-id count exactly, with the DB left unchanged after rollback.

### Batch RecomputeSeasonStats once per distinct player/team/game_type in bulk game_stats syncs (TASK-88)
**Status:** Settled

Confirmed against the real 2025-26 season: `SyncGameStats#call` recomputed every touched player's season stats after every single game, so a bulk sync issued one `RecomputeSeasonStats` call per game-stat row rather than once per player — 52,478 calls where ~1,148 distinct combos actually needed one each. Doesn't apply to `advanced_stats` — its per-game rollup is a load-bearing snapshot chain, not redundant work — so this is `game_stats` only, and doesn't matter for a daily sync where each player is only touched once anyway.

`SyncGameStats` gained a `recompute: true` kwarg (the single-game daily job leaves it `true`, unchanged) instead of bypassing it entirely in the two bulk callers as the task write-up first proposed — avoids duplicating its boxscore-fetch/upsert/`missing_players` wiring across three call sites for the same effect. New `RecomputeTouchedSeasonStats` accumulates `(player, team, game_type)` triples via `#track` and flushes once per distinct combo via `#call`, with a single batched `Player`/`Team` preload rather than one `find` per combo. Wired into both bulk callers — `AdminSyncOrchestrator#run_per_game_item` (flushed in an `ensure`, so a cancelled run still recomputes whatever it touched) and `nhl:backfill_game_stats` (flushed after the game loop).

A team-scoped run's game boxscores also upsert the *opponent's* players (pre-existing `UpsertGameStats` behavior, not new) — the batch tracks and recomputes those too, deduped the same way, correctly re-deriving from whatever's actually on file rather than just the games touched this run.

Verified against real data, not just specs: a rolled-back live transaction against EDM's full 2023-24 regular season (79 games) measured 3,156 old-style calls down to 771 (4.1x for one team's own season — lower than the original whole-league estimate, which counted a shared game's redundant reprocessing from every other team's item too; different scope, not a discrepancy). McDavid's regular-season line (74 GP, 32G/98A/130P) matched byte-for-byte before the run, in-transaction after the batched recompute, and after rollback.

### Surface every failed game on a sync run item, not just the last one (TASK-90)
**Status:** Settled

Found while investigating a real run (sync run 20, whole-league `game_stats`, 1,420 games) that completed 1419/1420 games successfully but still reported `status: failed` with no visible reason — a transient `Socket::ResolutionError` on one boxscore request. Root cause was two-fold: `run_per_game_item` overwrote `item.error_message` on every failure (so only the last one survived), and `SyncRun#log`'s capped `activity_log` had already pushed the one "Failed ..." line out under ~1,400 later "Completed ..." lines.

Fixed the visibility gap, deliberately left the status semantics alone: `sync_run_items` gained a `failed_games` jsonb column; `run_per_game_item` now accumulates every failure in memory (`nhl_game_id`, matchup label, error) and writes once at the end (or on cancel), instead of one write per failure. Serializer and `SyncRunDetailPage` surface the full list under a failed item. Item status is still binary (`failed` if any game failed, `completed` otherwise) — a "some games failed" vs "all games failed" distinction would need a new `SyncRun::STATUSES` value rippling through the frontend's status types and badges, a bigger call left for a deliberate follow-up (TASK-91) rather than folded in here.

### Development runs Solid Queue as a real, separate process (TASK-84)
**Status:** Settled

Development had no `active_job.queue_adapter` set at all, so it silently fell back to Rails' true default, `:async` — an in-process thread pool tied to Puma's own lifetime, no persistence, no per-queue concurrency limit. Confirmed as the root cause of two real incidents this session (a machine restart killing an in-flight sync with nothing to resume it; concurrent `RebuildAdvancedStatsJob`s racing on shared rows and throwing real `PG::TRDeadlockDetected`s) plus a third, ongoing one (GVL contention — the job's CPU-bound work sharing Puma's own request-handling threads made the dashboard unresponsive mid-sync).

Fixed by actually turning on what production already had wired: `development.rb` sets `queue_adapter = :solid_queue` and `solid_queue.connects_to`; `database.yml` gained a `queue:` entry for development and test (multi-db, matching production's shape rather than sharing the primary database — chosen explicitly for prod parity), which needed `db:prepare` (not `db:migrate` — there are no migration files for a schema-only secondary db, only `db/queue_schema.rb`) to actually provision. `make start` runs `bin/jobs` as its own OS process alongside Rails and Vite — deliberately not the `SOLID_QUEUE_IN_PUMA` plugin, which would still share Puma's process/GVL and fix nothing. `docker-compose.yml` gained a matching `worker` service (`ARCHITECTURE.md` already anticipated this: "a job runner, once one exists"). `AdminSyncOrchestrator#call` now skips items already `status: completed` when re-run, so a job Solid Queue re-claims after a crashed worker resumes instead of redoing finished work — a still-in-progress item is safe to simply re-run wholesale from its first game, since every upsert in the chain is already natural-key idempotent.

This also closes the deadlock scenario as a side effect, not a separate fix: `queue.yml`'s `ingest` queue (`processes: 1, threads: 1`, specifically to serialize NHL syncs) was always configured correctly — it was just inert under `:async`. A real Solid Queue worker makes it actually the only consumer of that queue, so `RebuildAdvancedStatsJob`s can no longer run concurrently against each other.

**Local caveat, actually fixed (not just worked around):** `bin/jobs` (Solid Queue's default `--mode=fork`) forks a child process per `queue.yml` role, and on this dev machine that fork reliably crashes — `EXC_BAD_ACCESS`/`SIGSEGV` inside the `pg` gem's C extension, routed through `libxpc.dylib`, a known macOS-only "fork() then touch a system framework in the child" bug class. First suspected the precompiled `arm64-darwin` gem's vendored libpq; ruled that out by rebuilding `pg` from source against a Homebrew-installed system libpq (`brew install libpq`, `force_ruby_platform: true` in the Gemfile) — identical crash, same line, proving it wasn't the library build. Initially assumed Solid Queue's own auto-restart-on-crash made this self-healing (true in early testing — a burst of crash-and-retry cycles before all roles landed within a few seconds) but a later run sat in an unresolving crash loop for over a minute in a real session, so "self-heals" wasn't actually reliable. Real fix: Solid Queue ships `--mode=async` (`bin/jobs start --mode=async`), which runs the dispatcher/worker in `bin/jobs`'s own process instead of forking children — never calls `fork()` at all, while remaining its own OS process, separate from Puma, so the GVL-isolation and persistence benefits TASK-84 needed are unaffected. Verified end to end: enqueued a job from a separate `bin/rails runner` process, confirmed the `--mode=async` worker actually executed it. The `pg`-from-source detour was reverted (`git checkout -- Gemfile Gemfile.lock`) since it never was the cause. `Makefile` and `docker-compose.yml` both use `--mode=async` now — irrelevant on Linux (this bug is macOS-only) but kept for one consistent command across both dev flows.

### Decouple ingestion from season-chain rebuild for bulk advanced_stats syncs (TASK-94)
**Status:** Settled

Proposed directly by Adam as a follow-up to TASK-93: `RebuildPlayerAdvancedStatsChain`/`RecomputeTeamSeasonAdvancedStats` are pure local-DB operations, no NHL API calls — confirmed. TASK-93 made the bulk path's chain rebuild synchronous instead of async, fixing the crash/backlog-blowup risk, but each game's ingestion still waited on its own chain-rebuild write before the next NHL fetch, so bulk throughput stayed bound by local compute, not just the rate limit.

Fixed by skipping the rebuild entirely during ingestion for a bulk sync (`SyncGameEvents`/`MarkGameForStatsRecompute`'s boolean `inline` flag became `recompute: :async | :skip`) and deferring it to one batch pass after the whole item's games are ingested. New `RebuildTouchedAdvancedStatsChains` tracks distinct players/teams/games touched, then for each player finds every `(strength_state, score_state)` dimension's own true earliest game for the season — not just the earliest game this particular run happened to touch first, since a dimension introduced partway through (a skater's first power-play shift, say) still needs its own correct anchor, or it would silently never get built. Team rollups don't need an anchor at all (`RecomputeTeamSeasonAdvancedStats` always re-sums the whole season). Wired into `AdminSyncOrchestrator` the same way as TASK-88's game_stats batch — tracked across the per-game loop, flushed once in an `ensure`.

Found and fixed in the same pass: `MarkGameForStatsRecompute`'s stale-marking query had no `season_id` filter either — a third instance of the exact bug class TASK-93 found in `RebuildPlayerAdvancedStatsChain`. Confirmed live: the in-progress 2023-24 backfill was spuriously marking a shared player's already-correct 2024-25/2025-26 rows stale (one sample player: all 333 2025-26 rows, all 18 2024-25 rows wrongly flagged, purely from touching an older season).

Verified end to end against real data, not just specs: a rolled-back transaction against already-ingested 2024-25 games found McDavid had **zero** `PlayerSeasonAdvancedStat` rows for that season at all — a live instance of the 1,456-failed-job gap TASK-93 had already flagged in the abstract. The new code correctly built his full real chain from scratch (60 games, 1639 Corsi-for, ≈27.3/game — a plausible number for a top-line center) with zero jobs enqueued, then rolled back cleanly with zero rows left behind.

### RecomputeTeamSeasonAdvancedStats: one query per team instead of one per column (TASK-95)
**Status:** Settled

Same bug as TASK-86 (`RecomputeSeasonStats`), found live in a different class TASK-86 never touched: `#upsert` issued 11 separate aggregate queries per `(strength_state, score_state, game_type)` dimension, re-summed from scratch off the whole season's `TeamGameAdvancedStat` rows every call — cost growing as the season filled in. Diagnosed while run 24 (advanced_stats, 2023-24) was crawling at ~1 game per 14-30s despite TASK-93 already making the player-chain rebuild O(1) per game. Fixed identically to TASK-86: load once, aggregate in Ruby.

Verified live, and a genuine Solid Queue mechanics lesson along the way: the already-running `AdminSyncOrchestratorJob` never picked up the fix, because it's one continuous per-game loop inside a single job execution, not one job per game — Rails' reload checkpoint only fires at a job's start, never mid-loop. Restarting `bin/jobs` was required, which in turn surfaced that a killed process's `solid_queue_processes` registration isn't pruned instantly — its claimed job stayed stuck until the stale `SolidQueue::Process` row was explicitly deleted (which does correctly cascade-release the claim). Both expected Solid Queue behavior, not bugs, but worth knowing before assuming a code fix landed just because the file changed.

### Mission Control - Jobs mounted for Solid Queue visibility (TASK-84 follow-up)
**Status:** Settled

Diagnosing the TASK-93/94 backlog required repeatedly querying `SolidQueue::Job`/`ReadyExecution`/`FailedExecution` directly via `bin/rails runner` — no self-service way to see queue/backlog state otherwise. Added `mission_control-jobs` (the official Rails/37signals dashboard for Solid Queue), mounted at `/jobs`, gated by HTTP Basic auth (`MISSION_CONTROL_USER`/`MISSION_CONTROL_PASSWORD`, `ENV.fetch` with a dev-safe default — same pattern as `JWT_SECRET`, not Rails encrypted credentials, so it stays consistent with how every other secret in this app is configured).

This app is `config.api_only = true`; Mission Control ships real HTML/JS/CSS views, which needs a real asset pipeline (`propshaft`, added alongside it) that API-only mode otherwise skips entirely. Deliberate, narrow carve-out — the JSON API under `/api/v1` is untouched, this is a separate, non-API surface for local/ops visibility only. Verified live: unauthenticated request to `/jobs` returns 401, correct credentials return 200.

### BaseApiClient: shared throttle/retry/error-handling for external clients (TASK-100)
**Status:** Settled

`NhlClient`, `NhlStatsClient`, and `HockeyTechClient` had grown ~90% duplicated: class-level throttle state, the retry-with-backoff wrapper, the transport-error rescue, and the `Error`/`NotFound`/`RateLimited`/`ServerError`/`TransportError` hierarchy were near-byte-identical across all three — real, already-paid cost, since an earlier `DEFAULT_MIN_INTERVAL` change had to be hand-applied to all three files separately.

Extracted `BaseApiClient`; each subclass now supplies only `BASE_URL` and its own endpoint methods, overriding `path_for`/`request_params`/`parse_body` where its request shape actually differs (`HockeyTechClient`'s fixed-path/query-folded view, its non-bare-JSON body). The shared `Error` hierarchy lives on `BaseApiClient` and subclasses inherit the same constants (`NhlClient::NotFound` and `HockeyTechClient::NotFound` are now the same class) — the one real caller doing `rescue NhlClient::NotFound` needed no change, since Ruby's constant lookup resolves it through the ancestor chain. Each subclass still gets its own independent throttle mutex/`last_request_at`, since `class << self; attr_accessor` defines per-singleton-class state, not something `class` methods share across subclasses — confirmed live (separate `Mutex` objects, one class's requests never waiting on another's).

Folded in three smaller findings from the same audit rather than filing them separately: `#perform`'s rescue list now also catches `OpenSSL::SSL::SSLError`/`EOFError` (previously skipped the retry/backoff entirely, verified via a live-network smoke test); `NhlClient#get`/`#get_following_redirects` now share one `#with_retries` instead of duplicating the same loop twice in one file; a persistent/keep-alive connection was explicitly deferred (documented in `BaseApiClient#perform`) since the enforced throttle interval already dwarfs one handshake's cost today.

Net ~97 fewer lines across the client layer despite gaining behavior (widened rescue list, shared retry helper). Verified against real data: all three clients hit their live APIs successfully post-refactor (standings, shift-chart, HockeyTech seasons, a 307-redirect roster fetch, and a real 404), plus the full existing spec suite (338 examples) unchanged.

### Danger-zone boundaries in our coordinate system (TASK-106)
**Status:** Settled

EPIC-18 locked in adopting the public "home plate" shot-danger definition (Elias / War-on-Ice, as used by Natural Stat Trick and MoneyPuck) rather than inventing one. This task translated it into our `x_coord`/`y_coord` frame — feet, attacking net at `(XgFormula::HALF_RINK_X, 0)` — and validated the buckets against every ingested shot.

**`DangerZone` holds constants only.** TASK-107 adds `DangerZone.classify`; the draft classifier logic lives in `rake danger_zone:validate` until then.

**High-danger** = the home-plate polygon: `[54, ±22] → [69, ±22] → [89, ±3]`, i.e. from the top of the offensive faceoff circles (dot at x=69 minus the 15ft circle radius), out through the faceoff dots, angled to the goal posts — the source definition, verbatim, in our units. Plus a rounded front: any shot within `HIGH_DANGER_CREASE_RADIUS_FT` (8ft ≈ crease radius + a stick) is high-danger regardless of angle, so goal-mouth jams still count.

**Mid-range / long-range** split shots *outside* the polygon by distance to the net (`MID_RANGE_MAX_DISTANCE_FT`, 60ft — just inside the offensive blue line, 64ft down the middle). Per EPIC-18's "polygon + distance bands" decision — not the War-on-Ice nested-grid approach, which needs the event modifiers (rebound, royal-road) that our xG hold-back (TASK-81) rules out for now.

**Validation** (`rake danger_zone:validate`, no API call — re-runnable against ingested `game_events`): across 4,420 games / 375k shot events / 27k goals — high-danger 43% of shots but **72% of goals**, mid-range 44%/23%, long-range 12%/4%. Consistent with the known "most goals come from the home plate" result. Hand-checked samples: close in-slot goals land in high-danger, point shots in long-range (the two ACs). Known edge behavior, not a bug: the polygon deliberately excludes sharp-angle shots near the goal line, so ~3.7% of goals recorded within 15ft (bad-angle jams beyond the crease radius) classify as mid-range — matching how the geometric standard itself behaves. ~2.7% of goals have coordinates that normalize to the far end (empty-netters shot from the defensive zone, plus noisy source coords); they fall in long-range, which is harmless.

**Coordinate normalization** reuses the same `home_team_defending_side` → `target_net_x` resolution as `ComputeGameAdvancedStats`, then folds every shot onto the +x net. TASK-107 will extract that shared step so `XgFormula` and `DangerZone` both call it.

### Project scope / feature set
**Status:** Open — tracked as epics/tasks in `planning/` (schema-validated JSON, served in-app at `/admin/roadmap`), not as prose here.
