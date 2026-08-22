# NHL team seed data

32 current NHL teams: abbreviation, name, logo filename, hex color palette (primary/secondary/tertiary).

- `teams.json` — the manifest.
- `logos/` — PNG per team, keyed by `logo` field above.
- `affiliations.json` — each NHL team's AHL affiliate and (where one currently exists) ECHL affiliate, by `nhl` abbreviation. Buffalo, the Rangers, and Utah currently have no ECHL affiliate (`echl_affiliate: null`) — accurate as of Aug 2026, not a data gap.

Sources: logos pulled from the hockeywiz repo (all but Seattle and Utah, reconstructed from the `react-nhl-logos` npm package's inline SVGs); colors from teamcolorcodes.com and sportsteamcolorcodes.com (Utah Mammoth, renamed from Arizona Coyotes for 2024-25); affiliations from echl.com/teams/nhl-ahl-affiliations, cross-checked against recent NHL/ECHL team announcements for the 3 teams missing from that page's table.

Not wired into backend seeds or frontend assets yet — this is raw material for TASK-6/TASK-8/TASK-17 seed work (AHL and ECHL only exist here as affiliate names, not as League/Team rows — that's a follow-up if the AHL/ECHL tiers get built out) and frontend team branding.
