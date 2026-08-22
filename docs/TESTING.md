# Testing Philosophy

Portfolio project — testing exists to catch real breakage and demonstrate good practice, not to chase a coverage number. No coverage gate, no coverage badge.

## What gets a test

- One happy-path smoke test per model, service, and endpoint (backend); per component, hook, and feature (frontend).
- A second test only for a genuinely important failure mode — a validation that would silently corrupt data, an edge case that actually matters. Not "for completeness."
- Don't write a test to move a coverage number. Write it because the code's failure mode is worth catching.

## Abstract ruthlessly

Shared setup lives in one place. A test file that copies another test file's setup is a signal to extract a helper, not to copy further.

- Backend: FactoryBot factories for every model (no fixtures). RSpec `shared_examples`/`shared_context` for repeated behavior (e.g. "an authenticated endpoint," "a paginated index"). Common request-spec plumbing (auth headers, JSON parsing) lives in `spec/support/`.
- Frontend: one custom render wrapper (`src/test-utils.tsx`) wrapping RTL's `render` with whatever providers exist. One mock API layer (e.g. MSW handlers) defined once and reused, not re-mocked per file.

## Stack

- Backend: RSpec, request specs (not controller specs) for endpoints.
- Frontend: Vitest + React Testing Library. Test behavior — what the user sees/does — not implementation details.
