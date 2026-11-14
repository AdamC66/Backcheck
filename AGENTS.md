# AGENTS.md

Read the root `CLAUDE.md` first, then `backend/CLAUDE.md` / `frontend/CLAUDE.md` for whichever side you touch. Those, plus `docs/STANDARDS.md` and `docs/TESTING.md`, are the conventions. This file only adds what the task queue needs.

## Commands
- test (backend): `make test` (starts the dockerized Postgres, runs the full RSpec suite)
- test (backend, one file): `cd backend && DATABASE_HOST=localhost DATABASE_USERNAME=postgres DATABASE_PASSWORD=postgres bundle exec rspec <path>`
- test (frontend): `cd frontend && npm test`
- lint: `cd backend && bin/rubocop -a <files>` · `cd frontend && npm run lint` · `cd frontend && npx tsc -b --noEmit`
- run: `make start` (Rails :3000, job worker, Vite :5173). Stop with `make stop`.

## Verify
auto: full RSpec + Vitest green, lint clean, typecheck clean.
QA is manual: `make start`, open http://localhost:5173, exercise the changed page.

## Review lenses
- code: backend/CLAUDE.md + frontend/CLAUDE.md conventions; one component per file; no comments without a nameable bug
- security: multi-tenant. Every endpoint scopes by Membership/league/team and fails closed; only jobs call NhlClient
- ui: match the team dashboard direction (team-color navy sidebar, zero border-radius everywhere, Oswald + Manrope type, Jersey 20 for numbers, TeamHeader hem-stripe as the sidebar divider)

## Conventions
- Decisions: check docs/DECISIONS.md before any architectural or dependency choice; log new ones there.
- Planning: task status lives in planning/data/tasks.json. Edit only the `status` field, keep existing escaping, validate with `python3 planning/validate.py`.
- Run tests when a change needs them (the spec/test file for the code you touched). Full suites are not needed before every commit; they run during QA and before push.

## Never
- Commit, push, or amend unless the task body says to. No Co-Authored-By lines.
- Touch lines the task didn't ask for. `git diff` must show only the requested change.
- Stop, restart, or reconfigure Docker containers. If Postgres can't bind :5432, report it.
- Use `git commit --no-verify` or `rubocop -A`.
- Commit files over 50 MB (GitHub rejects anything over 100 MB in any unpushed commit).
- Edit or commit `.work/` or `.claude/settings.local.json`.
