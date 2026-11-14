# Development Standards

Applies across the whole repo (backend and frontend).

## Comment policy (strict)

- **Default to zero comments.** The bar to add one: name the specific bug a maintainer would introduce without it. If you can't name one, there's no comment.
- When you do add one, say in your PR/response what that bug is. A reviewer asking you to cut comments means the change isn't finished.
- Never write summary comments on a class, method, or field. If a comment is needed to explain *what* code does, restructure (extract, rename) instead of annotating.
- 1-2 lines maximum. Legitimate cases: a non-obvious business rule, a workaround for an external constraint, a deliberate deviation from the expected pattern.
- No commented-out code left in commits. Delete it — git history has it if it's ever needed.
- No changelog-style comments (`# added this on 2024-01-01`). Git history is the changelog.

Bad: `# increment counter by 1` above `counter += 1`
Bad: `# Returns the normalized shot coordinates` above `def normalized_coords`
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

## Running tests

- Run tests when a change needs them: the spec/test file for the code you touched. Don't run the full suite after small edits or before every commit; run it during QA and before pushing — not delegated to a git hook.
- RuboCop/ESLint autofix on touched files is cheap and fine to run freely — this rule is about full suite runs specifically.

## Decisions

Any architectural or dependency choice that isn't already settled in `DECISIONS.md` gets discussed before being implemented, then logged there once made. Don't let a real decision live only in chat history.
