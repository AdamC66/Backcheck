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
Matches the machine's `nvm alias default`, so the pin and the ambient shell agree — a mismatch is how hooks end up running under a different Node than the terminal. A modern major is required regardless: Vite 8 needs `^20.19 || >=22.12`, lint-staged 17 needs `>=22.22`, and ESLint 10 crashes on `util.styleText` when *printing* violations under Node < 20.12, turning a useful lint failure into a stack trace. Pinned to major `26` so nvm resolves the latest installed patch. Note 26 is Current, not yet LTS (LTS ~Oct 2026) — fine for a portfolio project; revisit if a deploy target demands LTS.

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
