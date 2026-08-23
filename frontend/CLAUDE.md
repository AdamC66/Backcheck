# Frontend — React + TypeScript + Tailwind

Applies inside `frontend/`. Read `../docs/STANDARDS.md` first — comment policy and git workflow apply here too.

## Framework: Vite (settled)

Vite-bundled SPA, React 19, Tailwind v4 (via `@tailwindcss/vite`, configured in CSS — there is no `tailwind.config.js`). Nothing here needs SSR or SEO. Don't reopen this without a concrete requirement; see `docs/DECISIONS.md`.

## Component rules (strict)

- One component per file. The file name matches the component name (`GameSummaryCard.tsx`, not `index.tsx`).
- No folder created just to hold one file. A component gets its own folder once it has a co-located test: `GameSummaryCard/GameSummaryCard.tsx` + `GameSummaryCard/tests/GameSummaryCard.test.tsx`. The folder exists because there are two real files, not as a wrapper around one. A lone `.tsx` plus an `index.ts` that just re-exports it is exactly what this rule forbids — the component file itself is still never named `index.tsx`.
- Components are built reusable by default: props-driven, no hidden dependence on a specific page's data shape. If a component only ever makes sense in one place, that's fine, but don't hardcode assumptions that block reuse for free.
- No default exports for components — named exports only, so imports stay greppable and renames stay honest.

## Imports (strict)

- Absolute imports only: `@/components/GameSummaryCard`, never relative parent traversal (`../../components/GameSummaryCard`). `@` maps to `src/` — declared in **two** places that must stay in sync: `paths` in `tsconfig.app.json` (no `baseUrl`; it's deprecated in TS 6) and `resolve.alias` in `vite.config.ts`. Change one, change both, or types and the bundle disagree.
- Exception: a test file importing the thing it tests uses a relative import — which, given tests live in a `tests/` subfolder, means `../GameSummaryCard`, not `@/components/.../GameSummaryCard`. This keeps a component and its test adjacent by construction — if the component is later moved (a container extracted into a presentational `components/` entry, say), the test moves with it and that import never needs touching. Shared test infrastructure (e.g. `test-utils.tsx`, mock handlers) is not "the thing under test" — those import absolute like normal code.

## Structure (container / presentational split)

- `src/containers/` — pages and anything else that owns state or fetches data. A container calls hooks, handles loading/error/empty branches, and passes plain props down. It is the only place a page's data comes from.
  - The folder layout mirrors the app's information architecture, not just its file count. A container with no child routes stays a flat file (`DashboardPage.tsx`, tests in the shared `containers/tests/`). A container that owns nested routes — `TeamPage` renders `/teams/:id`, `/teams/:id/schedule`, `/teams/:id/roster` via `<Outlet />` — becomes a folder (`TeamPage/TeamPage.tsx` plus its child pages as siblings, `TeamPage/tests/` alongside them), so the directory tree reads as the route tree. Promote a flat container to this shape when it grows child routes; don't do it pre-emptively for a page that doesn't have any yet.
- `src/components/` — **strictly rendering**. Props in, JSX out. No `useQuery`, no model imports for fetching, no knowledge of where data came from. Local UI state that's purely visual (a hover, an open/closed disclosure) is fine; anything that outlives a render or touches the server belongs to a container.
- `src/models/` — the data layer: request functions, React Query hooks, and the payload types they produce, one module per domain (`models/leagues.ts`, `models/auth.ts`). Three rules keep it testable:
  - Request functions and the hooks that call them live in **separate files** (`leagues.ts` / `useLeagues.ts`). A hook calling a request function through its own module's internal binding can't be intercepted by `vi.mock` of that module.
  - Query keys live in `models/queryKeys.ts`, never beside a request function. `vi.mock` auto-mocking empties exported arrays, so a key defined next to a mocked fetch becomes `[]` in tests — and two such keys then collide in the query cache, which surfaces as one query's data appearing under another's.
  - Payload types are exported from the model that owns them (`League` from `models/leagues.ts`), not a separate types folder.
- `src/auth/` — the one cohesive unit that isn't split: provider, context, `useAuth`, and both route guards. Identity is cross-cutting enough that scattering it across containers/models costs more than the exception.
- `src/hooks/` — shared custom hooks that aren't data fetching.
- `src/lib/` — pure utilities and infrastructure with no React in it: `apiClient.ts` (the envelope/base-URL/bearer wrapper every model calls), `tokenStorage.ts`, `layout.ts`.

## TypeScript

- `strict` mode on, no exceptions.
- No `any`. If the type is genuinely unknown, use `unknown` and narrow it.
- Props get an explicit interface/type, not inferred from usage.

## Formatting & linting

- Prettier owns formatting, ESLint owns correctness. `eslint-config-prettier` is extended **last** in `eslint.config.js` — never add a stylistic ESLint rule that Prettier already decides.
- Config is `.prettierrc.json`: defaults plus `printWidth: 100`. Don't hand-format against it; run `npm run format`.
- `npm run lint` / `npm run format:check` are the read-only checks; `npm run format` writes.
- Pre-commit (husky + lint-staged, hooks in `.husky/`): staged `.ts`/`.tsx` get `eslint --fix` then `prettier --write`; other staged files get `prettier --write`. A lint error `--fix` can't resolve aborts the commit. Fix it — don't reach for `--no-verify`.
- `.husky/pre-commit` is the whole repo's hook, not just the frontend's — it also runs RuboCop over staged Ruby (see `../backend/CLAUDE.md`). It lives here because husky needs a `package.json`, and this is the only one. Don't assume changes to it are frontend-only.
- Node 26 (`.nvmrc`). Older Node breaks this toolchain in confusing ways — ESLint 10 stack-traces instead of printing the violation.

## Styling

- Tailwind utility classes in JSX. No separate CSS files per component.
- Repeated utility clusters become a component, not a `@apply` abstraction — composition over CSS abstraction.

## State management

TanStack React Query owns server state; `useState` covers local UI only (form fields, toggles). No Redux/Zustand — nothing here is client-owned enough to need one.

- Components never call `fetch`. Request functions live in `src/models/`, and only `src/lib/apiClient.ts` knows about the `data`/`error` envelope, the base URL, and the bearer header. A hook that unwraps `data` itself is a bug.
- Failed requests throw `ApiError` (`code`, `message`, `status`). Branch on `code`, never on `message` text.
- Query keys are exported from `src/models/queryKeys.ts` (e.g. `CURRENT_USER_KEY`), never written inline as string arrays at each call site — see Structure above for why they don't live beside their request functions.

## Auth & routing

- Identity comes from `useAuth()` (`src/auth/`). It reads a React Query cache entry rather than keeping a second copy of the user, so there's one source of truth.
- The token lives in `localStorage` via `src/lib/tokenStorage.ts` — always through those helpers, never `localStorage` directly (every access needs the try/catch they already have).
- Route protection is `<RequireAuth>`. It shows a loading state while a stored token is being verified instead of redirecting, so refreshes don't flash the login screen.
- A context that provides a component _and_ other values must be split across files — `react-refresh/only-export-components` fails a module that mixes them. See `authContext.ts` / `AuthProvider.tsx` / `useAuth.ts` for the shape.

## Testing

Smoke-test approach — see `../docs/TESTING.md` for the shared philosophy (portfolio project, not chasing coverage).

- Vitest + React Testing Library. One happy-path test per component/hook/feature; a second only for a failure mode worth catching.
- Test behavior (what the user sees/does), not implementation details.
- Shared setup lives in one place: `renderWithProviders` (`src/test-utils.tsx`) for anything needing the query client, router, or auth context; plain RTL `render` for a standalone primitive. Fixtures live in `src/test-mocks.ts` — don't invent a second shape for "a user".
- Vitest globals are off deliberately: import `describe`/`it`/`expect` from `vitest`. The consequence is that RTL's auto-cleanup isn't registered for you — `src/test-setup.ts` does it, and that file is also where the Node 26 `localStorage` polyfill lives. Don't remove either without reading the comments.
- Tests live in a `tests/` subfolder next to what they test (see Component rules and Imports above), and import their subject relatively.

## More rules incoming

User will hand down additional frontend standards as the project takes shape — append them here, don't let them live only in chat history.
