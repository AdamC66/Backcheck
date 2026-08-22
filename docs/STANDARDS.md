# Development Standards

Applies across the whole repo (backend and frontend).

## Comment policy (strict)

- Comments explain *why*, never *how*. The code already shows how; a comment repeating it is noise.
- 1-2 lines maximum, and only when the reasoning genuinely isn't obvious from the code itself (a non-obvious business rule, a workaround for an external constraint, a deliberate deviation from the expected pattern).
- If a comment is needed to explain *what* a block of code does, that's a signal the code should be restructured (extracted, renamed) instead of annotated.
- No commented-out code left in commits. Delete it — git history has it if it's ever needed.
- No changelog-style comments (`# added this on 2024-01-01`). Git history is the changelog.

Bad: `# increment counter by 1` above `counter += 1`
Good: `# Rails' default JSON serializer chokes on BigDecimal here, so we cast explicitly` above a `.to_f` cast

## No vibe-coded slop

- Don't paste in a pattern you don't understand well enough to explain. If unsure how something works, say so and work through it rather than shipping a guess.
- Every change should be explainable in one sentence: what it does and why it's needed.
- Delete dead code and unused imports/vars as you touch a file — don't let cruft accumulate "just in case."

## Git workflow

- `master` is always deployable (once there's something to deploy).
- Feature branches: `feature/<short-description>`, `fix/<short-description>`.
- Commit messages: imperative mood, present tense (`Add game stats serializer`, not `Added` or `Adding`). Body explains why when the subject line isn't self-evident.
- Squash noisy WIP commits before merging; keep meaningful commits intact.

## Definition of done

A change is done when:
1. It does what it claims, and nothing else snuck in.
2. A smoke test exists for new logic and passes (backend: RSpec; frontend: Vitest/RTL) — see `TESTING.md` for how much is enough.
3. No stray comments, dead code, or console/debug output left in.
4. Docs updated if the change affects architecture, an established convention, or a decision already logged in `DECISIONS.md`.

## Decisions

Any architectural or dependency choice that isn't already settled in `DECISIONS.md` gets discussed before being implemented, then logged there once made. Don't let a real decision live only in chat history.
