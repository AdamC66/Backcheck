# Frontend — React + TypeScript + Tailwind

Applies inside `frontend/`. Read `../docs/STANDARDS.md` first — comment policy and git workflow apply here too.

## Framework: Vite vs Next.js — undecided

Default assumption is a Vite-bundled SPA unless a requirement forces SSR/routing-on-the-server (SEO, server-side data fetching, etc.) — this is a staff-only internal dashboard, which leans away from needing Next. Don't scaffold either until this is confirmed; record the final call in `docs/DECISIONS.md`.

## Component rules (strict)

- One component per file. The file name matches the component name (`GameSummaryCard.tsx`, not `index.tsx`).
- No folder created just to hold one file. A component only gets its own folder when it genuinely has multiple co-located files (e.g. a component + its own subcomponents it doesn't share). A lone `.tsx` plus an `index.ts` that just re-exports it is exactly what this rule forbids.
- Components are built reusable by default: props-driven, no hidden dependence on a specific page's data shape. If a component only ever makes sense in one place, that's fine, but don't hardcode assumptions that block reuse for free.
- No default exports for components — named exports only, so imports stay greppable and renames stay honest.

## Structure (starting point, will evolve)

- `src/components/` — generic, reusable, presentational components (buttons, cards, tables, layout primitives). No API calls, no business logic.
- `src/features/<feature>/` — feature-specific components and logic (e.g. `features/roster/`, `features/game-stats/`). A feature component composed from `components/` primitives lives here, not in `components/`.
- `src/hooks/` — shared custom hooks.
- `src/api/` — API client layer (fetch/query logic), typed request/response shapes. Components don't call `fetch` directly.
- `src/types/` — shared TypeScript types not owned by a single feature.
- `src/lib/` — pure utility functions.

## TypeScript

- `strict` mode on, no exceptions.
- No `any`. If the type is genuinely unknown, use `unknown` and narrow it.
- Props get an explicit interface/type, not inferred from usage.

## Styling

- Tailwind utility classes in JSX. No separate CSS files per component.
- Repeated utility clusters become a component, not a `@apply` abstraction — composition over CSS abstraction.

## State management

Not yet decided (React Query vs. plain fetch+hooks vs. something heavier depends on how much server state ends up client-cached). Don't introduce a state library speculatively — add to `docs/DECISIONS.md` when the need is concrete.

## Testing

Smoke-test approach — see `../docs/TESTING.md` for the shared philosophy (portfolio project, not chasing coverage).

- Vitest + React Testing Library. One happy-path test per component/hook/feature; a second only for a failure mode worth catching.
- Test behavior (what the user sees/does), not implementation details.
- Shared setup lives in one place: a custom `render` wrapper (`src/test-utils.tsx`) and one reusable mock API layer — not re-built per test file.

## More rules incoming

User will hand down additional frontend standards as the project takes shape — append them here, don't let them live only in chat history.
