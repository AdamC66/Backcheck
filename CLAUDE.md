# Hockey Analytics Dashboard

Dashboard for hockey team staff/admins to review their team's analytics. Scope is still being defined — see `docs/PLANNING.md`.

## Stack

- Backend: Ruby on Rails, API-only, PostgreSQL, Dockerized. Developer is new to Rails — favor idiomatic, well-explained structure over clever shortcuts.
- Frontend: React + TypeScript, Tailwind. Vite vs Next.js undecided — see `docs/DECISIONS.md`.
- Repo: monorepo, `backend/` and `frontend/` as siblings.

## Read before working in a subdirectory

- `backend/CLAUDE.md` — Rails conventions
- `frontend/CLAUDE.md` — React/TS conventions
- `docs/STANDARDS.md` — comment policy, git workflow, definition of done (applies everywhere)
- `docs/ARCHITECTURE.md` — how backend and frontend fit together, Docker layout
- `docs/DECISIONS.md` — decision log, check before re-litigating a settled choice
- `docs/PLANNING.md` — current phase and scope

## Non-negotiables (full detail in docs/STANDARDS.md)

- Comments explain *why*, never *how*. 1-2 lines, only when the code can't speak for itself. No comment restating what the next line obviously does.
- No vibe-coded slop: understand the change before writing it, don't paste in unverified patterns.
- One component per file. No folders that hold a single file's worth of content.
- Ask before making an architectural call that isn't already in `docs/DECISIONS.md`. Log it there once made.

## Communication style

Be terse. No preamble, no restating the question back. State what you did or what you need, then stop.
