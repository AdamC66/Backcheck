# ECHL team seed data

30 current ECHL teams: abbreviation, name, NHL affiliate, logo filename.

- `teams.json` — the manifest. `nhl_affiliate` is the parent NHL team's abbreviation (matches `data/nhl-teams/teams.json`), and matches the `echl_affiliate` side of `data/nhl-teams/affiliations.json`. Norfolk Admirals (`NFK`) is currently unaffiliated with any NHL team, hence `nhl_affiliate: null` — not a data gap.
- `logos/` — PNG per team, keyed by `logo` field above.

Sources: team list and NHL affiliations from echl.com's live affiliations table (`echl.com/teams/nhl-ahl-affiliations`), cross-checked against recent team announcements as of Aug 2026 (e.g. the New York Rangers' ECHL affiliate moved from Bloomington to nothing, with Bloomington instead affiliating with Winnipeg). Logos pulled live from each team's English Wikipedia article infobox (120px PNG renditions of the infobox logo image), fetched one team at a time via a real browser session — no bulk ECHL logo package exists on npm or GitHub, and the cloud sandbox can't reach Wikimedia's image CDN directly. Maine Mariners and Norfolk Admirals needed their `(ECHL)` disambiguation suffix looked up separately since the plain article titles are disambiguation pages (Maine Mariners is also a defunct AHL/pro team name; Norfolk Admirals has both an AHL and an ECHL history).

Caveats:
- Abbreviations are self-assigned for this project (3-4 letters, generally the common shorthand fans use) — the ECHL has no single official abbreviation standard the way the NHL does, so don't treat these as authoritative external codes.
- Not wired into backend seeds yet — this is raw material for a future League/Team seed task (see TASK-17 and the "AHL/ECHL as real leagues" note in `docs/DECISIONS.md`) and frontend team branding.
