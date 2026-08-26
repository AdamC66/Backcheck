# Decision Log

Newest first. One entry per decision: what, why, alternatives considered.

---

### Frontend data tables: @tanstack/react-table (v8), one shared DataTable component
**Status:** Settled
First third-party UI-adjacent dependency in the frontend — every other piece of UI here is hand-rolled (see the Toast decision below). Justified as a distinct case: TanStack Table is headless, owning no markup or styles, only column/sort/pagination state and row/column models — closer in kind to React Query (already a dependency) than to a styled component kit, so it doesn't compete with the hand-rolled-UI stance the same way. `DataTable` (`frontend/src/components/DataTable`) wraps `useReactTable` and owns the actual `<table>` markup once; `SkaterStatsTable`/`GoalieStatsTable` are now just column definitions, replacing two near-identical hand-rolled tables and a hand-rolled `useSortableRows` hook (deleted). Pinned to v8, not the just-released v9: v9 restructured its primary API (no `useReactTable`/`getCoreRowModel` at the top level, a `createTableHook` pattern instead) with no solid precedent to build against confidently yet; v8 is the stable, widely-documented line. v1 wires sorting only — pagination and filtering are TanStack's row models to add later, when a league-wide stats page (hundreds of rows, real filters) actually needs them, not built speculatively now. Known cost: `useReactTable`'s returned handlers aren't stable across renders, which trips `eslint-plugin-react-hooks`'s React-Compiler-readiness check (`react-hooks/incompatible-library`) on `DataTable` — a warning, not an error, and moot today since React Compiler isn't wired into the build, but worth knowing if that ever changes.

### Admin sync console: no date/game columns on SyncRun — today's date, one item per team for game-stats
**Status:** Settled
Building `AdminSyncOrchestrator` (TASK-50) surfaced two scope gaps the `SyncRun`/`SyncRunItem` schema (TASK-47) didn't cover: `SyncStandings`/`SyncDailyScores` take a `date:`, and `SyncGameStats` takes a single `game:`, but neither table has a `date` or `game_id` column. Rather than reopen the already-migrated schema, both resolve without one. Standings/daily-scores always sync `Date.current` — an admin trigger is "pull current data now," not a historical backfill, so there's nothing for a date picker to do yet. Game-stats tracks progress per team, not per game: one `SyncRunItem` means "resync every finished game this team has in the run's season," looping `SyncGameStats` internally over `Game.for_team(team).for_season(season).finished` — consistent with roster/schedule's own per-team granularity, and safe because every sync service here is already upsert-based (see "Recompute-from-source, not increment-on-insert" below). `SyncKindRegistry`'s `game_stats` scope axes reflect this orchestrator-level requirement (`[:team, :season]`), not `SyncGameStats`'s own signature (`[:game]`). Revisit if the console ever needs a real historical-date or single-game re-run — that's an actual schema addition, not a workaround.

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

### Project scope / feature set
**Status:** Open — being tracked as epics/tasks in `planning/`, not just prose here. See `PLANNING.md`.
