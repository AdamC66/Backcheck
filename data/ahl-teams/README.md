# AHL team seed data

32 current AHL teams: abbreviation, name, NHL affiliate, logo filename, hex color palette.

- `teams.json` — the manifest. `nhl_affiliate` is the parent NHL team's abbreviation (matches `data/nhl-teams/teams.json`), and matches the `ahl_affiliate` side of `data/nhl-teams/affiliations.json`.
- `logos/` — PNG per team, keyed by `logo` field above.

Sources: team list and NHL affiliations cross-checked against `data/nhl-teams/affiliations.json` (itself sourced from echl.com's affiliations table plus recent team announcements) as of Aug 2026. Logos pulled live from each team's English Wikipedia article infobox (120px PNG renditions of the infobox logo image) — no bulk AHL logo package exists on npm or GitHub, so these were fetched one team at a time via a real browser session rather than the cloud sandbox (which can't reach Wikimedia's image CDN directly).

Colors: `primary`/`secondary`/`tertiary` hex, sourced from teamcolorcodes.com's per-team pages (Aug 2026), keeping that site's own color order. White is deliberately dropped from the sequence — nearly every team lists it, and a white "primary" renders as an invisible accent against the dashboard's white cards. `tertiary` is present only where a team has a third non-white color.

Caveats:
- Abbreviations are self-assigned for this project (3-4 letters, generally the common shorthand fans use) — the AHL has no single official abbreviation standard the way the NHL does, so don't treat these as authoritative external codes.
- **Hamilton Hammers colors are sampled, not official.** The franchise is too new for any color-code site; its announced palette is "blue, orange, white" with no published hex. The values here were sampled from the dominant pixels of `logos/HAM.png` and match those names. Replace with official values when the team publishes a brand sheet.
- **Laval Rocket has no secondary color** — teamcolorcodes lists only blue and white for them.
- **Ontario Reign is contested.** teamcolorcodes lists gray/black/white (used here); trucolor.net lists a 2025-26 palette of black, purple ("Inland Blue" #582C83), and gold. If the Reign have in fact rebranded, this row is stale.
