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

### Testing approach: smoke tests, no coverage gate
**Status:** Settled
Portfolio project — 1-2 tests per unit (happy path, plus a real edge case when one exists), not exhaustive coverage. No coverage tooling/gate. Shared test setup (factories, shared_examples, custom render/mock layer) abstracted into one place per stack so individual test files stay thin. See `TESTING.md`.

### Frontend bundler: Vite vs Next.js
**Status:** Open — leaning Vite
This is a staff-only internal dashboard, not a public/SEO-driven site, which weakens the case for Next's SSR/routing. Vite is the lighter default. Revisit if a concrete requirement (auth-gated SSR, server data fetching, image optimization at scale) makes the case for Next. Decide before scaffolding either.

### Auth mechanism
**Status:** Open
Not yet decided (session cookie vs token-based). Needs a decision before the first protected endpoint.

### API response/error envelope shape
**Status:** Open
Needs a single consistent shape decided before the first real endpoint ships, so it doesn't drift per-endpoint.

### Frontend state management
**Status:** Open
Plain fetch+hooks vs. React Query vs. something heavier — deferred until real server-state needs (caching, invalidation) show up.

### Project scope / feature set
**Status:** Open
See `PLANNING.md`.
