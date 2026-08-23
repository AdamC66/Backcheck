# API

Every endpoint is under `/api/v1/` and answers with the envelope from `DECISIONS.md`:
success is `{ "data": ..., "meta": ... }`, failure is `{ "error": { "code", "message" } }`.
All endpoints except `login` and `health` need `Authorization: Bearer <jwt>`.

Anything the caller isn't scoped to answers **404, not 403** — a 403 would confirm the
record exists to someone with no business knowing.

## Auth

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/login` | Exchange credentials for a token + user |
| DELETE | `/logout` | Revoke the presented token (204) |
| GET | `/me` | Rehydrate identity from a stored token |
| GET | `/health` | Liveness probe (public) |

`POST /login` takes `{ "email", "password" }` and returns `{ "token", "user" }`.
`user` is `{ id, email, is_super_admin }`.

## Leagues

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/leagues` | Leagues visible to the caller, ranked by tier |
| GET | `/leagues/:slug` | One league, with its teams |

```jsonc
// GET /api/v1/leagues/nhl
{ "data": {
  "id": 1, "name": "National Hockey League", "slug": "nhl",
  "abbreviation": "NHL", "tier": 1,
  "logo_url": "http://localhost:3000/rails/active_storage/blobs/proxy/…/NHL.svg",
  "teams": [ /* team objects, alphabetical */ ]
} }
```

A **team** object, used everywhere a team appears:

```jsonc
{ "id": 28, "name": "Toronto Maple Leafs", "abbreviation": "TOR",
  "nhl_team_id": 10,              // null outside the NHL
  "logo_url": "…/anaheim.png",    // null when no logo is attached
  "primary_color": "#00205B", "secondary_color": "#FFFFFF", "tertiary_color": null }
```

## Standings

| Method | Path |
| --- | --- |
| GET | `/leagues/:league_slug/standings` |

| Param | Default | Notes |
| --- | --- | --- |
| `season` | newest season held for the league | Label form, e.g. `2025-26` |
| `date` | latest snapshot in the season | `YYYY-MM-DD`; standings *as of* that date |

Standings are stored as dated snapshots, so `date` is a real query, not a filter over one
current row. Rows come back in `league_sequence` order.

```jsonc
// GET /api/v1/leagues/nhl/standings?season=2025-26
{ "data": [ {
    "team": { /* team object */ },
    "as_of_date": "2026-04-17",
    "games_played": 82, "wins": 55, "losses": 16, "ot_losses": 11,
    "points": 121, "point_pctg": 0.7378,
    "goals_for": 302, "goals_against": 203, "goal_differential": 99,
    "regulation_wins": 48, "regulation_plus_ot_wins": 51,
    "streak_code": "W", "streak_count": 3,
    "conference_name": "Western", "conference_sequence": 1,
    "division_name": "Central", "division_sequence": 1,
    "league_sequence": 1, "wildcard_sequence": 0,
    "home_record": { "wins": 26, "losses": 9, "ot_losses": 6 },
    "road_record": { "wins": 29, "losses": 7, "ot_losses": 5 },
    "l10_record":  { "wins": 7,  "losses": 2, "ot_losses": 1 }
  } ],
  "meta": { "season": "2025-26", "as_of_date": "2026-04-17" } }
```

## Teams and games

| Method | Path |
| --- | --- |
| GET | `/teams/:id` |
| GET | `/teams/:id/games` |
| GET | `/leagues/:league_slug/games` |

Both game endpoints return the same chronological list of the shape below, and both take
`game_type` (`regular_season` excludes preseason and playoffs). They page differently: a
team's games are bounded by its season, so those take a `from`/`to` window, while the
league's are bounded by date-at-a-time cursors. Every date is `YYYY-MM-DD`, and a
malformed one — or any other bad parameter — answers **422 `invalid_parameter`** rather
than quietly substituting a default.

**`/teams/:id/games`** — one team's home and away fixtures.

| Param | Default | Notes |
| --- | --- | --- |
| `season` | newest season held for the team's league | Label form, e.g. `2025-26` |
| `from` / `to` | the whole season | No cap; a season is ~88 games |

With no range the season alone bounds the results, which deliberately includes preseason
and playoff dates. Bounding by the season's `starts_on`/`ends_on` would not: those are the
*standings* window, and September and playoff games fall outside it.

**`/leagues/:league_slug/games`** — pages by whole dates, for a scoreboard ticker.

| Param | Default | Notes |
| --- | --- | --- |
| `date` | today | The anchor, inclusive |
| `direction` | `forward` | `forward` takes dates from the anchor onward, `backward` takes them going back. Either way the response is in date order |
| `limit` | 25 | *Minimum* games, not maximum. Capped at 100 |

It walks dates outward from the anchor, taking each one **entirely**, until it has at
least `limit` games — so a date is never split across pages and a client can group by
date safely. That means the count overshoots: with a median of 5 games a date and a
maximum of 16, `limit=25` typically returns 3–5 dates and 25–40 games. One date is always
returned in full even when it alone exceeds the limit.

Dates with no games are skipped rather than paged through, so crossing the summer costs
one request. `prev_cursor` and `next_cursor` are the adjacent dates that *have* games —
pass one back as `date` (with the matching `direction`) to page. They're `null` at the
ends of the schedule.

With no `date`, it anchors on today and looks forward; if nothing is scheduled from today
on — true from April to October — it falls back to the most recent games instead of
returning an empty strip.

A single day is still expressible: `?date=2026-04-15&limit=1` returns all of that date's
games and nothing more.

```jsonc
// GET /api/v1/leagues/nhl/games?date=2026-01-05&limit=25
{ "data": [ /* games, chronological */ ],
  "meta": { "dates": ["2026-01-05","2026-01-06","2026-01-07","2026-01-08"],
            "count": 32,
            "prev_cursor": "2026-01-04",
            "next_cursor": "2026-01-09" } }
```

```jsonc
// GET /api/v1/teams/28/games?game_type=regular_season
{ "data": [ {
    "id": 412, "nhl_game_id": 2025020004,
    "game_type": "regular_season",      // preseason | regular_season | playoffs
    "game_date": "2025-10-08",          // venue-local date
    "starts_at": "2025-10-08T23:00:00Z",
    "venue": "Scotiabank Arena", "neutral_site": false,
    "state": "OFF",                     // FUT | PRE | LIVE | FINAL | OFF
    "last_period_type": "REG",          // REG | OT | SO; null before the game ends
    "home": { "team": { /* team object */ }, "score": 5 },
    "away": { "team": { /* team object */ }, "score": 2 }
  } ],
  "meta": { "season": "2025-26", "from": "2025-09-21", "to": "2026-04-15", "count": 88 } }
```

The league endpoint's `meta` carries `from`, `to`, and `count` but no `season`, since a
range can cross one.

## Logo files

`logo_url` points at an Active Storage proxy route
(`/rails/active_storage/blobs/proxy/…`). Those URLs are public and long-lived by design —
an `<img>` tag can't send a bearer token. They change only when the underlying file does.

---

# Upstream: NHL endpoints we consume

Base URL `https://api-web.nhle.com`. Full reference:
[Zmalski/NHL-API-Reference](https://github.com/Zmalski/NHL-API-Reference). We call these
only from jobs, never on a request — see `DECISIONS.md`.

| Endpoint | What we take | Where |
| --- | --- | --- |
| `/v1/standings-season` | Season list with `standingsStart`/`standingsEnd` → Season rows | `SyncSeasons` |
| `/v1/standings/{date}` | 32 teams × 82 fields → a `TeamStanding` snapshot each | `SyncStandings` |
| `/v1/club-schedule-season/{abbrev}/{season}` | A team's full season → `Game` rows | `SyncTeamSchedule` |
| `/v1/score/{date}` | Score and state for one date's games | `SyncDailyScores` |

Things worth knowing about these payloads:

- **Standings carry no numeric team id** — only `teamAbbrev`. Schedule payloads carry
  both, which is where `Team#nhl_team_id` gets filled in.
- **The snapshot date comes from the payload** (`row["date"]`), not from the date we
  requested. Asking for an offseason date returns the final standings still dated to the
  end of the season, so repeated syncs update one row instead of inventing new ones.
- **We keep ~30 of the 82 standings fields.** The rest are percentages and per-split
  sequences that are derivable or unused; adding one back is a migration, not a re-fetch.
- **Preseason games can involve non-NHL clubs** (Global Series opponents such as `MUN`).
  Those are skipped and reported, not silently dropped.
