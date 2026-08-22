# ECHL team seed data

30 current ECHL teams: abbreviation, name, NHL affiliate, logo filename, hex color palette.

- `teams.json` — the manifest. `nhl_affiliate` is the parent NHL team's abbreviation (matches `data/nhl-teams/teams.json`), and matches the `echl_affiliate` side of `data/nhl-teams/affiliations.json`. Norfolk Admirals (`NFK`) is currently unaffiliated with any NHL team, hence `nhl_affiliate: null` — not a data gap.
- `logos/` — PNG per team, keyed by `logo` field above.

Sources: team list and NHL affiliations from echl.com's live affiliations table (`echl.com/teams/nhl-ahl-affiliations`), cross-checked against recent team announcements as of Aug 2026 (e.g. the New York Rangers' ECHL affiliate moved from Bloomington to nothing, with Bloomington instead affiliating with Winnipeg). Logos pulled live from each team's English Wikipedia article infobox (120px PNG renditions of the infobox logo image), fetched one team at a time via a real browser session — no bulk ECHL logo package exists on npm or GitHub, and the cloud sandbox can't reach Wikimedia's image CDN directly. Maine Mariners and Norfolk Admirals needed their `(ECHL)` disambiguation suffix looked up separately since the plain article titles are disambiguation pages (Maine Mariners is also a defunct AHL/pro team name; Norfolk Admirals has both an AHL and an ECHL history).

Colors: `primary`/`secondary`/`tertiary` hex, sourced from teamcolorcodes.com's per-team pages (Aug 2026), keeping that site's own color order. White is deliberately dropped from the sequence — nearly every team lists it, and a white "primary" renders as an invisible accent against the dashboard's white cards. `tertiary` is present only where a team has a third non-white color.

Caveats:
- Abbreviations are self-assigned for this project (3-4 letters, generally the common shorthand fans use) — the ECHL has no single official abbreviation standard the way the NHL does, so don't treat these as authoritative external codes.
- **Four teams' colors are sampled, not official** — no color-code site covers them yet, and their announcements name colors without publishing hex. Values were sampled from the dominant pixels of each team's logo PNG and cross-checked against those announced names: Bloomington Bison ("red, blue, white"), Greensboro Gargoyles ("Gargoyle Grape, Greensboro Gold, Midnight"), New Mexico Goatheads ("desert red, sand, Rio Grande blue"), Trenton Ironhawks ("blue, grey, red" — its blue appears only as small highlights in the logo, so that one is the least certain). Replace with official values when brand sheets appear.
- **Tahoe Knight Monsters** are also sampled (black + Vegas gold). Note the ECHL announced new Knight Monsters colors for 2026-27 adding sky/powder blue, which this palette predates.
