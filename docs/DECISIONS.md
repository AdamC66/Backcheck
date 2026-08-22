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

### Domain model informed by prior attempt (hockeywiz)
**Status:** Settled
A prior solo attempt at this same domain (github.com/AdamC66/hockeywiz, Django, pre-AI-assisted) was reviewed for reusable ideas and known mistakes — see `ARCHITECTURE.md`'s Domain Model section for the resulting entity list. Carried forward: team rest/fatigue as a computed signal, season as data. Carried forward as things to explicitly avoid: hardcoded season strings, a combined skater+goalie stats table, synchronous blocking external-API calls on the request path, no auth/multi-tenancy at all, secrets committed to source, no tests.

### Frontend import convention: absolute, except tests
**Status:** Settled
All component/hook/feature imports use the `@/` absolute alias, never relative parent traversal. Exception: a test file importing its own subject uses a relative import, so the test stays adjacent to the component through folder moves (e.g. a component promoted from a feature folder into shared `components/`). Component file itself is still never named `index.tsx` (see `frontend/CLAUDE.md`).

### Testing approach: smoke tests, no coverage gate
**Status:** Settled
Portfolio project — 1-2 tests per unit (happy path, plus a real edge case when one exists), not exhaustive coverage. No coverage tooling/gate. Shared test setup (factories, shared_examples, custom render/mock layer) abstracted into one place per stack so individual test files stay thin. See `TESTING.md`.

### Frontend bundler: Vite vs Next.js
**Status:** Open — leaning Vite
This is a staff-only internal dashboard, not a public/SEO-driven site, which weakens the case for Next's SSR/routing. Vite is the lighter default. Revisit if a concrete requirement (auth-gated SSR, server data fetching, image optimization at scale) makes the case for Next. Decide before scaffolding either.

### API response/error envelope shape
**Status:** Open
Needs a single consistent shape decided before the first real endpoint ships, so it doesn't drift per-endpoint.

### Frontend state management
**Status:** Open
Plain fetch+hooks vs. React Query vs. something heavier — deferred until real server-state needs (caching, invalidation) show up.

### Authorization enforcement mechanism
**Status:** Open
The data model (Role/Membership/scope) is settled; how it's enforced in controllers — hand-rolled scope checks vs. a policy-object gem (e.g. Pundit) — is left until the backend exists.

### External stats data source
**Status:** Open
Manual entry, CSV import, or a live provider/scrape — not yet decided. Whatever it is, sync happens in a background job, never inline on the request path (see `ARCHITECTURE.md`).

### Project scope / feature set
**Status:** Open — being tracked as epics/tasks in `planning/`, not just prose here. See `PLANNING.md`.
