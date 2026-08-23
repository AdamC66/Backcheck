# NHL team seed data

32 current NHL teams: abbreviation, name, logo filename, hex color palette (primary/secondary/tertiary).

- `teams.json` — the manifest.
- `logos/` — PNG per team, keyed by `logo` field above.
- `affiliations.json` — each NHL team's AHL affiliate and (where one currently exists) ECHL affiliate, by `nhl` abbreviation. Buffalo, the Rangers, and Utah currently have no ECHL affiliate (`echl_affiliate: null`) — accurate as of Aug 2026, not a data gap.

Sources: logos pulled from the hockeywiz repo, except Utah (reconstructed from the `react-nhl-logos` npm package's inline SVGs) and Seattle (`seattle.svg`, taken from the NHL's own asset CDN at `assets.nhle.com/logos/nhl/svg/SEA_light.svg` — the same URL the API's `teamLogo` field points at). Seattle's reconstruction came out as scrambled fragments and was replaced on 2026-08-22; Utah's was checked against the official mark and is correct. It's the one SVG among PNGs, which nothing in the stack minds. **Its `viewBox` is tightened from the CDN's `0 0 960 640` to `262 48 435 543`** — the official file centres the mark in a wide canvas, so at 44% of the viewBox width it rendered visibly smaller than the tightly-cropped PNGs beside it. Re-pulling from the CDN brings the padding back. Colors from teamcolorcodes.com and sportsteamcolorcodes.com (Utah Mammoth, renamed from Arizona Coyotes for 2024-25); affiliations from echl.com/teams/nhl-ahl-affiliations, cross-checked against recent NHL/ECHL team announcements for the 3 teams missing from that page's table.

**Montreal's `tertiary` white is ours, not the source's.** teamcolorcodes lists only red and blue for the Canadiens; the jersey — and *bleu-blanc-rouge* — plainly has white, and the UI's jersey-stripe trim needs it. Added by decision on 2026-08-22. Boston and Toronto are also two-colour rows and may have the same gap; left alone for now.

Wired into backend seeds: `ImportTeams` reads `teams.json` and attaches each `logos/` file as an Active Storage attachment on the Team. This directory stays the source of truth — re-running `db:seed` re-imports it, and a changed logo file replaces the stored blob (checksum-compared, so unchanged files are left alone). All three leagues now exist as real League/Team rows; only `affiliations.json` is still unused, pending TeamAffiliation (TASK-17).
