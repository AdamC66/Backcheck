# Planning

## Status: Phase 0 — Setup

Repo, standards, and architecture scaffolded. No application code yet. Scope below is a placeholder until it's defined.

## Phases

- **Phase 0 — Setup** (current): repo, CLAUDE.md files, standards, Docker plan.
- **Phase 1 — Scope & data model**: define what "team analytics" means concretely (see open questions below), design the core domain model.
- **Phase 2 — Backend skeleton**: `rails new`, Docker Compose wired up, first migration, health-check endpoint.
- **Phase 3 — Frontend skeleton**: Vite/Next scaffold (per decision), Tailwind configured, talks to backend health-check.
- **Phase 4 — First vertical slice**: one real feature end-to-end (e.g. one team's roster + one stat view) to validate the whole stack before building out breadth.
- **Phase 5+**: TBD, depends on what Phase 1 surfaces.

## Open questions blocking scope (Phase 1)

- Who are the users, precisely — single team's admin, or multiple teams/orgs per install (multi-tenancy)?
- Where does the underlying stat data come from — manual entry, CSV import, an external stats provider/API?
- What's the minimum viable set of analytics team staff actually need first (e.g. player performance, line combinations, game-by-game trends, special teams)?
- Roles: is every logged-in user an equal "admin," or are there tiers (head coach vs. assistant vs. analyst)?
- Historical depth: current season only, or multi-season history from day one?

## Backlog

Empty — populate once Phase 1 answers land.
