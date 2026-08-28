## Local-dev flow: backend (Rails) and frontend (Vite) run natively, Postgres runs in
## Docker (container + named volume `db_data` — see docker-compose.yml) so nobody needs a
## local Postgres install. Requires Docker Desktop running for db-up/init/start/test.
##
## Fully-dockerized alternative (backend included) is `docker compose up` directly —
## not wired into these targets.

DB_ENV := DATABASE_HOST=localhost DATABASE_USERNAME=postgres DATABASE_PASSWORD=postgres

.PHONY: help init start stop test db-up db-down

help:
	@echo "make init    - start Postgres (Docker), backend: bundle install + db prepare/seed, frontend: npm install"
	@echo "make start   - run backend (Rails, :3000), its job worker, and frontend (Vite, :5173) together. Ctrl+C stops all."
	@echo "make stop    - kill anything left listening on :3000 / :5173"
	@echo "make test    - run backend RSpec"
	@echo "make db-up   - start the Postgres container (with its volume)"
	@echo "make db-down - stop the Postgres container (volume persists)"

db-up:
	docker compose up -d db
	@echo "waiting for postgres..."; \
	i=0; \
	until docker compose exec -T db pg_isready -U postgres -q; do \
		i=$$((i+1)); \
		if [ $$i -ge 30 ]; then echo "postgres didn't become ready in time"; exit 1; fi; \
		sleep 1; \
	done; \
	echo "postgres ready"

db-down:
	docker compose stop db

init: db-up
	@echo "==> backend: bundle install"
	cd backend && bundle install
	@echo "==> backend: db prepare (primary + solid_queue) + seed"
	cd backend && $(DB_ENV) bin/rails db:prepare db:seed
	@echo "==> frontend: npm install"
	cd frontend && npm install
	@echo "==> done — run 'make start'"

# bin/jobs is a real separate process (not the SOLID_QUEUE_IN_PUMA plugin, which
# would share Puma's own GVL) — makes queue.yml's single-consumer ingest queue
# actually serialize NHL syncs, and lets a sync run survive a Rails restart (TASK-84).
# --mode=async: Solid Queue's own fork-per-role mode crashes on this machine (a
# macOS fork()-then-syscall bug, see docs/DECISIONS.md) — async runs the
# dispatcher/worker in bin/jobs's own process instead of forking children, so it
# never hits fork() at all, while still being its own OS process, separate from Puma.
start: db-up
	@trap 'kill 0' EXIT INT TERM; \
	(cd backend && $(DB_ENV) bin/rails server -p 3000) & \
	(cd backend && $(DB_ENV) bin/jobs start --mode=async) & \
	(cd frontend && npm run dev) & \
	wait

stop:
	-lsof -ti tcp:3000 | xargs kill 2>/dev/null
	-lsof -ti tcp:5173 | xargs kill 2>/dev/null

test: db-up
	cd backend && $(DB_ENV) bundle exec rspec
