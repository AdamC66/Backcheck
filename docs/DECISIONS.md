# Decision Log

Newest first. One entry per decision: what, why, alternatives considered.

---

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
Success responses wrap in `data`, with `meta` reserved for pagination and similar: `{ "data": {...}, "meta": {...} }`. Errors always take one shape with a machine-readable code: `{ "error": { "code": "invalid_credentials", "message": "...", "details": {...} } }`. `details` and `meta` are omitted when empty rather than sent as null. Enforced through the `ApiResponses` controller concern (`render_data` / `render_error`) so no controller hand-rolls a payload, and unwrapped in exactly one place on the client (`src/api/client.ts`), which is what makes every react-query hook typed the same way. Alternatives considered: flat top-level resources (less ceremony, but pagination metadata then has nowhere to live except headers) and full JSON:API (solves problems a solo dashboard doesn't have yet, and needs a serializer gem).

### Frontend state management: TanStack React Query
**Status:** Settled
Server state lives in React Query; React state covers only local UI concerns (form fields, menu open/closed). No Redux/Zustand — there is no meaningful client-owned state to justify one, and the identity that *is* app-wide is exposed through a context reading from a React Query cache entry rather than duplicating it. Query defaults: `retry: 1` and `refetchOnWindowFocus: false`, because a 401 or 422 will not fix itself on retry and aggressive refetching is noise on a dashboard.

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

### Authorization enforcement mechanism
**Status:** Open
The data model (Role/Membership/scope) is settled; how it's enforced in controllers — hand-rolled scope checks vs. a policy-object gem (e.g. Pundit) — is left until the backend exists.

### External stats data source
**Status:** Open
Manual entry, CSV import, or a live provider/scrape — not yet decided. Whatever it is, sync happens in a background job, never inline on the request path (see `ARCHITECTURE.md`).

### Project scope / feature set
**Status:** Open — being tracked as epics/tasks in `planning/`, not just prose here. See `PLANNING.md`.
