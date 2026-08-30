# Backcheck

Backcheck is a public-facing, multi-tenant hockey analytics dashboard: many leagues, each with many teams, staffed by league/team users with scoped roles (Super Admin > League Admin > team roles like GM/Assistant GM/Coaching Staff). Full scope is still being refined — see the `planning/` epics/tasks board.

## Stack

- Backend: Ruby on Rails, API-only, PostgreSQL, Dockerized. Custom bcrypt+JWT auth (no Devise). Developer is new to Rails — favor idiomatic, well-explained structure over clever shortcuts.
- Frontend: React + TypeScript, Tailwind, bundled by Vite (settled — see `docs/DECISIONS.md`).
- Repo: monorepo, `backend/` and `frontend/` as siblings.

## Read before working in a subdirectory

- `backend/CLAUDE.md` — Rails conventions
- `frontend/CLAUDE.md` — React/TS conventions
- `docs/STANDARDS.md` — comment policy, git workflow, definition of done (applies everywhere)
- `docs/TESTING.md` — testing philosophy: smoke tests only, abstract shared setup (applies everywhere)
- `docs/ARCHITECTURE.md` — how backend and frontend fit together, Docker layout
- `docs/DECISIONS.md` — decision log, check before re-litigating a settled choice
- `planning/` — the epics/tasks board (JSON validated against `planning/schemas/`); the tracker for what's built, in progress, and next. Served in-app at `/admin/roadmap`.

## Non-negotiables (full detail in docs/STANDARDS.md)

- **Comments: default to none.** Write code that doesn't need them. Before adding any comment, state in your response the specific bug a maintainer would introduce without it — no nameable bug, delete it. Never write class/method/field summary comments. A comment describing *what* the code does is always wrong. If a reviewer has to ask you to cut comments, the change wasn't done.
- No vibe-coded slop: understand the change before writing it, don't paste in unverified patterns.
- One component per file. No folders that hold a single file's worth of content.
- Ask before making an architectural call that isn't already in `docs/DECISIONS.md`. Log it there once made.

## Communication style

Be terse. No preamble, no restating the question back. State what you did or what you need, then stop.
