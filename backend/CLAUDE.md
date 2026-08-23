# Backend — Rails (API-only)

Applies inside `backend/`. Read `../docs/STANDARDS.md` first — comment policy and git workflow apply here too.

Developer is new to Rails. Prefer idiomatic, conventional patterns over clever ones. When a Rails convention exists for something, use it and name it, rather than inventing a bespoke approach.

## Structure

- `app/controllers/api/v1/` — namespaced from day one, even with a single client. Controllers stay thin: params in, service/model call, serialized response out. No business logic in controllers.
- `app/models/` — Active Record models. Validations and associations belong here. Anything more than a couple lines of business logic moves to a service object, not a fat model method.
- `app/services/` — plain Ruby objects for business logic that doesn't cleanly belong to one model (multi-step operations, external calls, anything a controller shouldn't own). One class, one job, name it as a verb (`ImportGameStats`, not `GameStatsHelper`).
- `app/queries/` — objects that build a non-trivial read, named for what they return (`GameDatePage`). Noun-named, unlike services, because they answer a question rather than perform an action. **Adding a new `app/` subdirectory needs a server restart** — Rails works out autoload paths at boot, so the running process 500s with an uninitialized constant until it's bounced.
- `app/serializers/` — response shaping. Don't hand-build JSON hashes in controllers.
- `spec/` — RSpec. Every model gets validation/association specs; every service gets a spec; request specs cover controller endpoints (not controller specs — those are deprecated in practice).

## API conventions

- All routes under `/api/v1/...`. Breaking changes get a new version, not an in-place change.
- One envelope, no exceptions: success is `{ data: ..., meta?: ... }`, failure is `{ error: { code, message, details? } }`. Always go through `render_data` / `render_error` (the `ApiResponses` concern) — never `render json:` a bare hash from a controller.
- `code` is a stable machine-readable string the frontend can branch on (`invalid_credentials`, `unauthorized`); `message` is for humans and may be reworded freely.
- Status codes used correctly: 422 for validation failures, 404 for missing records, 401/403 for auth — not 200-with-an-error-field.
- CORS (`config/initializers/cors.rb`): local dev allows any `localhost`/`127.0.0.1` port, because a Vite server that drifts to `:5174` otherwise surfaces as an unexplained CORS failure. Deployed environments must set `FRONTEND_ORIGIN` (comma-separated for more than one) — nothing is allowed by default outside dev.

## Data

- PostgreSQL. Every migration is reversible (`change`, or explicit `up`/`down` when `change` can't infer it).
- No raw SQL string interpolation — parameterize or use AR query methods.
- Watch for N+1s: `includes`/`preload` when serializing associations. If unsure, check the query log, don't guess.

## Auth & authorization

See `../docs/ARCHITECTURE.md` (Auth & multi-tenancy) and `../docs/DECISIONS.md` for the full model. Summary for backend work:

- `User` uses `has_secure_password` (bcrypt). No Devise. Email is normalized (`normalizes :email`), which also covers finder queries — don't re-downcase at call sites.
- Login issues a hand-rolled JWT (`user_id` + `jti` + expiry, signed with the app's secret). Verification lives only in `Api::V1::BaseController#authenticate_user!` — don't re-implement token parsing per controller. Controllers needing public access inherit `BaseController` and `skip_before_action :authenticate_user!` for those actions, so authentication stays opt-*out*.
- Logout revokes for real: the token's `jti` goes into `revoked_tokens` and every authenticated request checks it. That check is why a stolen token stops working after logout, so don't "optimize" it away.
- Permissions come from `Membership` (`user_id`, `role_id`, polymorphic `scopeable`), plus `User#is_super_admin`. `Role` is a lookup table — never hardcode role names as a Rails enum or a magic string scattered across controllers; reference `Role.find_by(key: ...)` or a constant defined once.
- A controller action's authorization check should read as one clear question ("does this user have a qualifying membership for this scopeable, or are they super admin?"), not inline ad-hoc conditionals repeated per action. Whether that's hand-rolled or a policy gem (Pundit) is still open — see `DECISIONS.md` — but don't let the pattern drift per-controller in the meantime.

## File storage

Active Storage (`has_one_attached`), not files committed to a public directory — it's Rails' equivalent of Django's `FileField` + django-storages, with metadata in `active_storage_*` tables and bytes in a per-environment service (`config/storage.yml`). Full reasoning in `../docs/DECISIONS.md`; the rules that matter when adding an attachment:

- Serialize with `rails_storage_proxy_url` via the `LogoUrl` helper — stable and cacheable. Not `rails_blob_url`, whose redirect target expires and will rot inside a cached response.
- Add a `with_logo`-style scope (`includes(<name>_attachment: :blob)`) wherever a collection is serialized, or every row costs two extra queries.
- Seed attachments through `AttachLogo`, which skips when the file's checksum already matches. Attaching unconditionally replaces the blob on every seed run and orphans the old one.
- Absolute URLs need `Rails.application.routes.default_url_options` (`config/initializers/default_url_options.rb`). There's no request context in a serializer, so a missing host is a 500, not a relative URL.
- **Changing how a blob is *served* doesn't reach clients that already fetched it.** Proxy responses carry `cache-control: immutable, max-age=100 years`, and the URL is keyed by blob id, not by content or content type — so a fix to content type or disposition leaves every cached copy broken, and an `immutable` entry survives a normal reload. `AttachLogo`'s checksum guard won't help either: the bytes didn't change. The fix is to replace the blob (`purge` then re-attach), which mints a new id and therefore a new URL.

## Background jobs, external services

Stats come from the NHL's public web API — see `../docs/DECISIONS.md` for the design and `../docs/API.md` for the endpoints consumed.

- `app/clients/` holds anything that talks to a third party. `NhlClient` is the only thing allowed to make an outbound HTTP call, and **only a job may call it** — never a controller, service-called-from-a-controller, or model callback. The prior attempt fetched inline from a resolver; that's the mistake this rule exists to prevent.
- Ingestion jobs are `queue_as :ingest`, which `config/queue.yml` runs single-threaded. That's what makes the client's request interval real, so don't move an ingestion job onto another queue.
- Sync services (`SyncStandings`, `SyncTeamSchedule`, …) take an injectable `client:` so specs pass a throttle-free one. They report unmatched records (`missing_teams`) rather than raising or silently skipping — a partial sync should be visible, not look clean.
- Specs never hit the network: webmock blocks it globally, and `spec/support/nhl_api_helpers.rb` provides `stub_nhl` plus trimmed real payloads in `spec/fixtures/files/nhl/`.

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
