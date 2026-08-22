# Backend — Rails (API-only)

Applies inside `backend/`. Read `../docs/STANDARDS.md` first — comment policy and git workflow apply here too.

Developer is new to Rails. Prefer idiomatic, conventional patterns over clever ones. When a Rails convention exists for something, use it and name it, rather than inventing a bespoke approach.

## Structure

- `app/controllers/api/v1/` — namespaced from day one, even with a single client. Controllers stay thin: params in, service/model call, serialized response out. No business logic in controllers.
- `app/models/` — Active Record models. Validations and associations belong here. Anything more than a couple lines of business logic moves to a service object, not a fat model method.
- `app/services/` — plain Ruby objects for business logic that doesn't cleanly belong to one model (multi-step operations, external calls, anything a controller shouldn't own). One class, one job, name it as a verb (`ImportGameStats`, not `GameStatsHelper`).
- `app/serializers/` — response shaping. Don't hand-build JSON hashes in controllers.
- `spec/` — RSpec. Every model gets validation/association specs; every service gets a spec; request specs cover controller endpoints (not controller specs — those are deprecated in practice).

## API conventions

- All routes under `/api/v1/...`. Breaking changes get a new version, not an in-place change.
- Consistent envelope for responses and errors (exact shape TBD — record it in `docs/DECISIONS.md` once picked, don't let it drift endpoint to endpoint).
- Status codes used correctly: 422 for validation failures, 404 for missing records, 401/403 for auth — not 200-with-an-error-field.

## Data

- PostgreSQL. Every migration is reversible (`change`, or explicit `up`/`down` when `change` can't infer it).
- No raw SQL string interpolation — parameterize or use AR query methods.
- Watch for N+1s: `includes`/`preload` when serializing associations. If unsure, check the query log, don't guess.

## Auth & authorization

See `../docs/ARCHITECTURE.md` (Auth & multi-tenancy) and `../docs/DECISIONS.md` for the full model. Summary for backend work:

- `User` uses `has_secure_password` (bcrypt). No Devise.
- Login issues a hand-rolled JWT (id + expiry, signed with the app's secret). Verify it in a single `before_action`/concern shared by every controller that needs auth — don't re-implement token parsing per controller.
- Permissions come from `Membership` (`user_id`, `role_id`, polymorphic `scopeable`), plus `User#is_super_admin`. `Role` is a lookup table — never hardcode role names as a Rails enum or a magic string scattered across controllers; reference `Role.find_by(key: ...)` or a constant defined once.
- A controller action's authorization check should read as one clear question ("does this user have a qualifying membership for this scopeable, or are they super admin?"), not inline ad-hoc conditionals repeated per action. Whether that's hand-rolled or a policy gem (Pundit) is still open — see `DECISIONS.md` — but don't let the pattern drift per-controller in the meantime.

## Background jobs, external services

Not yet decided (data source for stats is still open — see `DECISIONS.md`). Whatever it ends up being, external sync work is a background job, never executed inline on the request/response path.

## Testing

Smoke-test approach — see `../docs/TESTING.md` for the shared philosophy (portfolio project, not chasing coverage).

- RSpec. One happy-path spec per model/service/endpoint; a second only for a failure mode worth catching.
- Factories (FactoryBot), not fixtures. Shared setup goes in `shared_examples`/`spec/support/`, not copy-pasted per spec.
- Request specs (not controller specs) for endpoints.

## Formatting & linting

RuboCop is the formatter here 

- `rubocop-rails-omakase` is the style (see `.rubocop.yml`). It's deliberately the "don't configure it" preset — add an override only for a rule that actively causes problems, not to win a style argument.
- `bin/rubocop -a` formats. **Never `-A`** — that enables unsafe corrections that can change behavior, unlike a real formatter.
- Pre-commit runs `-a` on staged Ruby and aborts the commit if anything is left uncorrectable. Hook lives in `../frontend/.husky/` (husky owns the git hooks path — see `../docs/DECISIONS.md`).
- Omakase is lenient by design: it enforces layout (`[ :a, :b ]` spacing, commas) but leaves things like `a+b` alone. A clean RuboCop run is not a claim that the code reads well.

## Ruby version & Docker

- Ruby 3.4.10, pinned in `.mise.toml` (and `.ruby-version`). A local install exists so RuboCop and RSpec run in the terminal and in the pre-commit hook without paying container startup on every commit.
- Local dev runs Rails natively against a dockerized Postgres — `make init` then `make start` from the repo root, which is why the local Ruby matters beyond static tooling. `docker compose up` still runs the whole backend in a container; see `../docs/ARCHITECTURE.md` for both layouts.
