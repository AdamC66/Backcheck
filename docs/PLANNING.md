# Planning

## Status: Phase 1 — Scope & data model

Repo, standards, architecture, and auth/domain model are scaffolded. The live backlog (epics + tasks) lives in `planning/` as JSON validated against `planning/schemas/` — this file stays as narrative context, not the task tracker.

## Phases

- **Phase 0 — Setup** (done): repo, CLAUDE.md files, standards, Docker plan.
- **Phase 1 — Scope & data model** (current): multi-tenancy/auth model settled, hockey domain model settled (informed by a prior attempt — see `DECISIONS.md`), epics/tasks tracked in `planning/`.
- **Phase 2 — Backend skeleton**: `rails new`, Docker Compose wired up, first migration (users/roles/memberships), health-check endpoint.
- **Phase 3 — Frontend skeleton**: Vite/Next scaffold (per decision), Tailwind configured, auth screens against the backend.
- **Phase 4 — First vertical slice**: one real feature end-to-end (e.g. a league admin viewing one team's roster) to validate the whole stack, including auth/scoping, before building out breadth.
- **Phase 5+**: TBD, driven by `planning/`.

## Resolved (previously open questions)

- **Multi-tenancy**: yes — many leagues, each with many teams. See `ARCHITECTURE.md`.
- **Roles**: Super Admin (global, one person) > League Admin (all teams in a league) > team-scoped roles (GM, Assistant GM, Coaching Staff, extensible without a migration).
- **Auth mechanism**: custom bcrypt + JWT bearer token, not Devise, not cookies.

## Still open

- Where stat data comes from (manual entry / CSV / external provider) — see `DECISIONS.md`.
- Exact API error envelope shape.
- Historical depth (current season only vs. multi-season from day one) — the `Season` entity supports either; not yet decided how far back to actually populate.
- Authorization enforcement mechanism (hand-rolled vs. Pundit).

## Carried forward from the prior attempt (hockeywiz)

See `DECISIONS.md` for the full review. Worth keeping: team rest/fatigue as a computed signal, season modeled as real data. Explicitly avoiding this time: hardcoded season strings, a combined skater+goalie stats table, blocking external API calls on the request path, zero auth/multi-tenancy, secrets in source, no tests.
