# Writes one standings snapshot per team for a given date. Re-running for the same date
# updates those rows rather than adding duplicates.
class SyncStandings
  class UnknownSeason < StandardError; end

  def initialize(league:, date:, client: NhlClient.new)
    @league = league
    @date = date
    @client = client
    @missing_teams = []
  end

  attr_reader :missing_teams

  def call
    rows = client.standings_on(date).fetch("standings")

    rows.filter_map { |row| upsert(row) }
  end

  private

  attr_reader :league, :date, :client

  def upsert(row)
    team = team_for(row)
    return if team.nil?

    standing = TeamStanding.find_or_initialize_by(
      team: team, season: season_for(row), as_of_date: row.fetch("date")
    )

    standing.update!(attributes_from(row))
    standing
  end

  # Abbreviations are only unique within a league — CGY is both the Calgary Flames and
  # the AHL's Calgary Wranglers — and standings payloads carry no numeric team id, so
  # this lookup has to be league-scoped or it silently writes to the wrong team.
  def team_for(row)
    abbreviation = row.dig("teamAbbrev", "default")
    team = league.teams.find_by(abbreviation: abbreviation)

    missing_teams << abbreviation if team.nil?
    team
  end

  def season_for(row)
    nhl_season_id = row.fetch("seasonId")

    seasons[nhl_season_id] ||= league.seasons.find_by(nhl_season_id: nhl_season_id) ||
                               raise(UnknownSeason, "No season #{nhl_season_id} — run SyncSeasons first")
  end

  def seasons
    @seasons ||= {}
  end

  def attributes_from(row)
    {
      games_played: row.fetch("gamesPlayed"),
      wins: row.fetch("wins"),
      losses: row.fetch("losses"),
      ot_losses: row.fetch("otLosses"),
      points: row.fetch("points"),
      point_pctg: row["pointPctg"],
      goals_for: row.fetch("goalFor"),
      goals_against: row.fetch("goalAgainst"),
      goal_differential: row.fetch("goalDifferential"),
      regulation_wins: row["regulationWins"],
      regulation_plus_ot_wins: row["regulationPlusOtWins"],
      streak_code: row["streakCode"],
      streak_count: row["streakCount"],
      conference_name: row["conferenceName"],
      conference_sequence: row["conferenceSequence"],
      division_name: row["divisionName"],
      division_sequence: row["divisionSequence"],
      league_sequence: row["leagueSequence"],
      wildcard_sequence: row["wildcardSequence"],
      home_wins: row["homeWins"],
      home_losses: row["homeLosses"],
      home_ot_losses: row["homeOtLosses"],
      road_wins: row["roadWins"],
      road_losses: row["roadLosses"],
      road_ot_losses: row["roadOtLosses"],
      l10_wins: row["l10Wins"],
      l10_losses: row["l10Losses"],
      l10_ot_losses: row["l10OtLosses"]
    }
  end
end
