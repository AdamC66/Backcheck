# AHL team seed data

32 current AHL teams: abbreviation, name, NHL affiliate, logo filename.

- `teams.json` — the manifest. `nhl_affiliate` is the parent NHL team's abbreviation (matches `data/nhl-teams/teams.json`), and matches the `ahl_affiliate` side of `data/nhl-teams/affiliations.json`.
- `logos/` — PNG per team, keyed by `logo` field above.

Sources: team list and NHL affiliations cross-checked against `data/nhl-teams/affiliations.json` (itself sourced from echl.com's affiliations table plus recent team announcements) as of Aug 2026. Logos pulled live from each team's English Wikipedia article infobox (120px PNG renditions of the infobox logo image) — no bulk AHL logo package exists on npm or GitHub, so these were fetched one team at a time via a real browser session rather than the cloud sandbox (which can't reach Wikimedia's image CDN directly).

Caveats:
- Abbreviations are self-assigned for this project (3-4 letters, generally the common shorthand fans use) — the AHL has no single official abbreviation standard the way the NHL does, so don't treat these as authoritative external codes.
- Not wired into backend seeds yet — this is raw material for a future League/Team seed task (see TASK-17 and the "AHL/ECHL as real leagues" note in `docs/DECISIONS.md`) and frontend team branding.
