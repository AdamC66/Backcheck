# NHL team seed data

32 current NHL teams: abbreviation, name, logo filename, hex color palette (primary/secondary/tertiary).

- `teams.json` — the manifest.
- `logos/` — PNG per team, keyed by `logo` field above.
- `affiliations.json` — each NHL team's AHL affiliate and (where one currently exists) ECHL affiliate, by `nhl` abbreviation. Buffalo, the Rangers, and Utah currently have no ECHL affiliate (`echl_affiliate: null`) — accurate as of Aug 2026, not a data gap.

Sources: logos pulled from the hockeywiz repo (all but Seattle and Utah, reconstructed from the `react-nhl-logos` npm package's inline SVGs); colors from teamcolorcodes.com and sportsteamcolorcodes.com (Utah Mammoth, renamed from Arizona Coyotes for 2024-25); affiliations from echl.com/teams/nhl-ahl-affiliations, cross-checked against recent NHL/ECHL team announcements for the 3 teams missing from that page's table.

Wired into backend seeds: `ImportTeams` reads `teams.json` and attaches each `logos/` file as an Active Storage attachment on the Team. This directory stays the source of truth — re-running `db:seed` re-imports it, and a changed logo file replaces the stored blob (checksum-compared, so unchanged files are left alone). All three leagues now exist as real League/Team rows; only `affiliations.json` is still unused, pending TeamAffiliation (TASK-17).
