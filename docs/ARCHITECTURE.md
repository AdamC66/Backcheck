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
- `frontend`: runs via its own dev server (Vite or Next — see `DECISIONS.md`) against the backend's HTTP API. Not necessarily containerized for local dev; only the backend + database are Dockerized per the original requirement. Revisit if frontend containerization is needed for parity with a deploy target later.

## Backend ↔ Frontend contract

- REST-ish JSON over HTTP, namespaced under `/api/v1/`.
- Auth: JWT bearer token in the `Authorization` header (not a cookie — see Auth section below). Chosen specifically to sidestep cross-origin cookie friction between two separately-hosted apps.
- CORS: backend allows the frontend's dev origin explicitly, not a wildcard.

## Auth & multi-tenancy

This is a public-facing, multi-tenant app: many leagues, each with many teams, each with staff who should only see/edit what they're scoped to.

**Identity.** `User` has an email + `password_digest` (`has_secure_password`, bcrypt — no Devise). On login, the backend issues a signed JWT (custom-issued, not a gem) containing the user id and expiry; the frontend attaches it as `Authorization: Bearer <token>` on every request. No server-side session state.

**Authorization is scoped, not a flat role.** A user's permissions come from one or more `Membership` rows, each of which binds the user to a role *within a specific scope* — a league or a team. The same user can hold different roles in different scopes (e.g. GM of one team, and separately invited as coaching staff on another).

- `Role` is a lookup table (`key`, `label`, `scope_type`), not a hardcoded enum column. Adding "Head Coach" or "Scout" later is a data insert, not a migration — this was a deliberate choice since the team-role list is expected to get more granular over time.
- `Membership` = `user_id` + `role_id` + a polymorphic scope (`scopeable_type` / `scopeable_id`, either `League` or `Team`).
- **League-scoped roles** (e.g. `league_admin`): a League Admin can manage every team inside their league — rosters, trades, schedules — without needing a separate membership per team.
- **Team-scoped roles** (e.g. `gm`, `assistant_gm`, `coaching_staff`, ...): scoped to exactly one team.
- **Super Admin** is not a scoped role at all — it's a boolean flag directly on `User` (`is_super_admin`). There's exactly one of these (the site owner) and it bypasses scope checks entirely, including manual overrides like moving a player between teams or editing records directly.

Authorization checks (e.g. "can this user edit this team's roster?") are a single question against a user's memberships plus the super-admin flag — not scattered role-string comparisons across controllers. Exact enforcement mechanism (a policy-object layer, hand-rolled or via a gem like Pundit) is left open until the backend is scaffolded; the data model above is settled regardless of that choice.

## Domain model

Informed by a prior (pre-AI, Django-based) attempt at this same domain — see `DECISIONS.md` for what was carried forward and what's deliberately being done differently this time (that old app had zero multi-tenancy, a hardcoded season string, and a combined skater+goalie stats table, among other things).

- **League** — name, slug. Owns many Teams.
- **Team** — name, city, belongs to a League.
- **Season** — a first-class entity (`label`, `starts_on`, `ends_on`), not a hardcoded string. The old attempt baked `"20192020"`-style strings into business logic; this time season-scoped data (rosters, stats, schedule) all carry a real `season_id`.
- **Player** — bio fields (name, birth date, position, shoots/catches, height/weight), no direct `team_id`.
- **RosterEntry** — join of `player`, `team`, and `season` with `joined_on`/`left_on`. A trade or a Super Admin moving a player is: close the old entry, open a new one. This preserves full team history per player instead of overwriting a single current-team foreign key.
- **Game** — `season_id`, home/away `team_id`, date, scores, status. A team's rest state (back-to-back vs. days off) is a genuinely useful signal the old app computed inline (`calc_difficulty`); this time it's a derived/computed value, not duplicated raw data — exact implementation (computed on read vs. a refreshed materialized column) is a backend detail to decide later.
- **SkaterStatLine** / **GoalieStatLine** — kept as two separate tables, not one wide nullable table covering both stat families (the old app's approach). Each links a player to a game (or a season for aggregates).

External stats data source (scrape, provider API, manual entry) is still an open question — see `PLANNING.md`. Whatever it is, the old app's pattern of blocking, synchronous external calls inline in request handlers (with a literal `sleep(3)`) is explicitly not being repeated; any external sync belongs in a background job, not the request/response path.

## Docker

- `docker-compose.yml` at repo root defines `backend` + `db` (and anything else that needs to run alongside, e.g. a job runner, once one exists).
- Backend `Dockerfile` lives in `backend/`.
- No compose services are scaffolded yet — added once `rails new` happens, so the Gemfile/Dockerfile have real dependencies to build against.

## Data flow (placeholder)

Team/league staff → frontend → `Authorization: Bearer <jwt>` → `/api/v1/...` → Rails controller → scope/permission check against the user's memberships → service/model → Postgres → serializer → JSON → frontend renders analytics.
