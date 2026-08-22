# NHL team seed data

32 current NHL teams: abbreviation, name, logo filename, hex color palette (primary/secondary/tertiary).

- `teams.json` — the manifest.
- `logos/` — PNG per team, keyed by `logo` field above.

Sources: logos pulled from the hockeywiz repo (all but Seattle and Utah, reconstructed from the `react-nhl-logos` npm package's inline SVGs); colors from teamcolorcodes.com and sportsteamcolorcodes.com (Utah Mammoth, renamed from Arizona Coyotes for 2024-25).

Not wired into backend seeds or frontend assets yet — this is raw material for TASK-6/TASK-8 seed work and frontend team branding.
