# Architecture

## Layout

```
hockey-analytics-dashboard/
├── backend/          Rails API-only app
├── frontend/         React + TS SPA
├── docs/             this directory
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
- Auth mechanism: TBD (session cookie vs token). Needs deciding before the first protected endpoint is built — log the choice in `DECISIONS.md`.
- CORS: backend allows the frontend's dev origin explicitly, not a wildcard.

## Docker

- `docker-compose.yml` at repo root defines `backend` + `db` (and anything else that needs to run alongside, e.g. a job runner, once one exists).
- Backend `Dockerfile` lives in `backend/`.
- No compose services are scaffolded yet — added once `rails new` happens, so the Gemfile/Dockerfile have real dependencies to build against.

## Data flow (placeholder)

Team admin → frontend → `/api/v1/...` → Rails controller → service/model → Postgres → serializer → JSON → frontend renders analytics.

Exact domain entities (teams, games, players, stat categories, etc.) aren't modeled yet — see `PLANNING.md` for scope status.
