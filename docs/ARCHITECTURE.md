# Architecture

## Layout

```
hockey-analytics-dashboard/
├── backend/          Rails API-only app
├── frontend/         React + TS SPA
├── docs/             architecture, standards, decisions, planning
├── planning/         JSON-schema-backed epics/tasks board (see PLANNING.md)
├── docker-compose.yml
└── CLAUDE.md
```

Single repo, two independently runnable apps. They communicate over HTTP only — no shared code, no shared types package (revisit if duplication becomes painful).

## Runtime shape

- `backend`: Rails API container, talks to `db` (Postgres) container. Exposes JSON over HTTP.
- `db`: Postgres container, named volume for persistence.
- Uploaded/seeded files (logos) live in Active Storage's Disk service at `backend/storage/`, which the dockerized backend keeps via its source bind mount. A real deployment needs a mounted volume there, or a switch to S3 — see `DECISIONS.md`.
- `frontend`: runs via its own Vite dev server (port 5173, `strictPort`) against the backend's HTTP API. Not necessarily containerized for local dev; only the backend + database are Dockerized per the original requirement. Revisit if frontend containerization is needed for parity with a deploy target later.

## Backend ↔ Frontend contract

- REST-ish JSON over HTTP, namespaced under `/api/v1/`.
- Auth: JWT bearer token in the `Authorization` header (not a cookie — see Auth section below). Chosen specifically to sidestep cross-origin cookie friction between two separately-hosted apps.
- CORS: never a wildcard. Deployed environments name their origins in `FRONTEND_ORIGIN`; local dev accepts any `localhost`/`127.0.0.1` port, because a dev server that drifts to another port otherwise fails as an unexplained CORS error. See `DECISIONS.md`.
- Envelope: every response is `{ data, meta? }` or `{ error: { code, message, details? } }` — see `DECISIONS.md`.

## Auth & multi-tenancy

This is a public-facing, multi-tenant app: many leagues, each with many teams, each with staff who should only see/edit what they're scoped to.

**Identity.** `User` has an email + `password_digest` (`has_secure_password`, bcrypt — no Devise). On login, the backend issues a signed JWT (custom-issued, not a gem) containing the user id, a `jti`, and an expiry; the frontend attaches it as `Authorization: Bearer <token>` on every request.

Sessions are stateless *except* for revocation: logout records the token's `jti` in `revoked_tokens`, and `authenticate_user!` rejects any listed token, so logout genuinely invalidates rather than just dropping the token client-side. `PurgeRevokedTokensJob` clears rows once their token would have expired anyway.

| Endpoint | Auth | Purpose |
| --- | --- | --- |
| `POST /api/v1/login` | public | Exchange credentials for a token + user |
| `DELETE /api/v1/logout` | bearer | Revoke the presented token (204) |
| `GET /api/v1/me` | bearer | Rehydrate identity / confirm a stored token |
| `GET /api/v1/health` | public | Liveness probe |
| `GET /api/v1/leagues` | bearer | Leagues visible to the caller (all of them for a Super Admin) |
| `GET /api/v1/leagues/:slug` | bearer | One league with its teams; 404 (not 403) if the caller can't see it |
| `GET /api/v1/leagues/:slug/standings` | bearer | Dated standings snapshots for a season (`season`, `date` params) |
| `GET /api/v1/teams/:id` | bearer | One team |
| `GET /api/v1/teams/:id/games` | bearer | A team's games for a season (`season`, `game_type` params) |
| `GET /rails/active_storage/blobs/proxy/...` | signed URL | Logo bytes, streamed by Active Storage. Public by design — an `<img>` tag can't send a bearer token |

Full request/response shapes live in `API.md`.

There is no account-creation endpoint yet — the single Super Admin is seeded (`db/seeds.rb`). On the client, identity is held by `AuthProvider` and reached through `useAuth()`; `RequireAuth` and `RedirectIfAuthenticated` own both directions of the login redirect.

**Authorization is scoped, not a flat role.** A user's permissions come from one or more `Membership` rows, each of which binds the user to a role *within a specific scope* — a league or a team. The same user can hold different roles in different scopes (e.g. GM of one team, and separately invited as coaching staff on another).

- `Role` is a lookup table (`key`, `label`, `scope_type`), not a hardcoded enum column. Adding "Head Coach" or "Scout" later is a data insert, not a migration — this was a deliberate choice since the team-role list is expected to get more granular over time.
- `Membership` = `user_id` + `role_id` + a polymorphic scope (`scopeable_type` / `scopeable_id`, either `League` or `Team`).
- **League-scoped roles** (e.g. `league_admin`): a League Admin can manage every team inside their league — rosters, trades, schedules — without needing a separate membership per team.
- **Team-scoped roles** (e.g. `gm`, `assistant_gm`, `coaching_staff`, ...): scoped to exactly one team.
- **Super Admin** is not a scoped role at all — it's a boolean flag directly on `User` (`is_super_admin`). There's exactly one of these (the site owner) and it bypasses scope checks entirely, including manual overrides like moving a player between teams or editing records directly.

Authorization checks (e.g. "can this user edit this team's roster?") are a single question against a user's memberships plus the super-admin flag — not scattered role-string comparisons across controllers. Exact enforcement mechanism (a policy-object layer, hand-rolled or via a gem like Pundit) is left open until the backend is scaffolded; the data model above is settled regardless of that choice.

**Affiliate visibility.** A team's staff also get read access to that team's affiliate chain (e.g. an NHL GM can see their AHL and ECHL affiliates' rosters/stats) — see `TeamAffiliation` below. This is one-directional: affiliate staff do *not* get visibility up into the parent club. A Membership scope check on a Team must walk the affiliate chain downward from that team, not just match the Team row directly.

## Domain model

Informed by a prior (pre-AI, Django-based) attempt at this same domain — see `DECISIONS.md` for what was carried forward and what's deliberately being done differently this time (that old app had zero multi-tenancy, a hardcoded season string, and a combined skater+goalie stats table, among other things).

- **League** — name, slug, abbreviation, `tier` (rank in the affiliation hierarchy: NHL 1, AHL 2, ECHL 3), and a `logo` Active Storage attachment. Owns many Teams. Seeded from `db/seeds.rb`; artwork originates in `data/*.svg`.
- **Team** — full name ("Anaheim Ducks"), abbreviation (unique within its league — CGY is both the Flames and the Wranglers), a `logo` Active Storage attachment, and up to three hex colors. Belongs to a League. Seeded from `data/<slug>-teams/teams.json` by `ImportTeams`, keyed on abbreviation so a corrected manifest can be re-seeded.
- **TeamAffiliation** — self-join on Team: `parent_team_id`, `affiliate_team_id`, `started_on`/`ended_on`. Models the NHL→AHL→ECHL organizational chain (e.g. Ottawa Senators → Belleville Senators) the same history-preserving way `RosterEntry` handles player movement — affiliations change (an ECHL affiliate especially), so this is never a plain FK overwritten in place. Arbitrary depth (a chain, not a hardcoded 3-tier column set), since a team can be both an affiliate and a parent.
- **Season** — a first-class entity (`label`, `starts_on`, `ends_on`), not a hardcoded string, and **belongs to a League**: the AHL's 2025-26 is a different row with different dates than the NHL's. `nhl_season_id` (20252026) holds the upstream key on NHL rows. The old attempt baked `"20192020"`-style strings into business logic; this time season-scoped data (rosters, stats, schedule) all carry a real `season_id`. `Season.current` returns nothing between seasons, which is the honest answer rather than a guess.
- **Player** — bio fields (name, birth date, position, shoots/catches, height/weight), no direct `team_id`.
- **RosterEntry** — join of `player`, `team`, and `season` with `joined_on`/`left_on`. A trade or a Super Admin moving a player is: close the old entry, open a new one. This preserves full team history per player instead of overwriting a single current-team foreign key.
- **Game** — `nhl_game_id`, `season_id`, home/away `team_id`, `game_type` (preseason/regular/playoffs), `starts_at` plus a venue-local `game_date`, venue, scores, `state`, and `last_period_type` (REG/OT/SO). Validates that both teams and the season share a league. A team's rest state (back-to-back vs. days off) is a genuinely useful signal the old app computed inline (`calc_difficulty`); this time it's a derived/computed value, not duplicated raw data — exact implementation (computed on read vs. a refreshed materialized column) is a backend detail to decide later.
- **TeamStanding** — a dated standings snapshot per team per season (`as_of_date`), covering record, goals, streak, placement sequences, and home/road/L10 splits. History-preserving rather than a single row overwritten each sync — see `DECISIONS.md`.
- **SkaterStatLine** / **GoalieStatLine** — kept as two separate tables, not one wide nullable table covering both stat families (the old app's approach). Each links a player to a game (or a season for aggregates).

Stat data comes from the NHL's public web API (`api-web.nhle.com`) — see `DECISIONS.md` for the ingestion design. The old app's pattern of blocking, synchronous external calls inline in request handlers (with a literal `sleep(3)`) is explicitly not repeated: `NhlClient` is called only from jobs on a single-threaded `ingest` queue, and the request path only ever reads what's already in Postgres.

## Docker

- Local dev default: backend and frontend run natively (Makefile); Postgres runs in Docker (container + named volume `db_data`) via `make db-up`/`init`/`start` — nobody needs a local Postgres install.
- Fully-dockerized alternative: `docker compose up` runs `backend` (built from `Dockerfile.dev`) alongside `db` — not what the Makefile targets use.

- `docker-compose.yml` at repo root defines `backend` + `db` (and anything else that needs to run alongside, e.g. a job runner, once one exists).
- `backend/Dockerfile` is Rails-generated (production/Kamal — do not use for local dev). `backend/Dockerfile.dev` is what `docker-compose.yml` actually builds: no multi-stage/precompile, source mounted as a volume for live reload.
- `db` (Postgres 16) + `backend` (built from `Dockerfile.dev`) are wired up in `docker-compose.yml` at repo root.

## Data flow (placeholder)

Team/league staff → frontend → `Authorization: Bearer <jwt>` → `/api/v1/...` → Rails controller → scope/permission check against the user's memberships → service/model → Postgres → serializer → JSON → frontend renders analytics.
