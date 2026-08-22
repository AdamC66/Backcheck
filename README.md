# Backcheck

Multi-tenant hockey analytics dashboard for league and team staff — rosters, games, and player movement across an organization's affiliate chain.

Status: backend and frontend scaffolded; auth works end to end (login, real token revocation on logout, protected routes). See `docs/PLANNING.md` for current phase and the `planning/` board for tickets.

## Stack

- Backend: Ruby on Rails (API-only) + PostgreSQL. Ruby 3.4.10 via mise; Postgres in Docker.
- Frontend: React + TypeScript + Tailwind, bundled by Vite. Node 26 via `.nvmrc`.

## Docs

- [`CLAUDE.md`](./CLAUDE.md) — project-wide context and non-negotiables
- [`backend/CLAUDE.md`](./backend/CLAUDE.md) — Rails conventions
- [`frontend/CLAUDE.md`](./frontend/CLAUDE.md) — React/TS conventions
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — system layout
- [`docs/STANDARDS.md`](./docs/STANDARDS.md) — comment policy, git workflow, definition of done
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — decision log
- [`docs/PLANNING.md`](./docs/PLANNING.md) — phases, scope status, open questions

## Setup

Requires Docker (for Postgres), mise, and nvm.

```sh
make init    # start Postgres, install gems + npm deps, create/migrate/seed the database
make start   # run Rails on :3000 and Vite on :5173 together
```

`make test` runs the backend suite; `npm test` in `frontend/` runs the frontend suite. `make stop` frees both ports.

Seeds create the single Super Admin — `admin@example.com` / `password123` by default, overridable with `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`. There is no sign-up endpoint yet.
