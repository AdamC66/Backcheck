# Shared by both game syncs: the schedule and daily-score payloads describe a game
# almost identically.
class UpsertGame
  class UnknownSeason < StandardError; end

  # Unknown teams skip their game rather than raising; callers report these so a partial
  # sync can't pass for a clean one.
  attr_reader :missing_teams

  def initialize(league:, payload:)
    @league = league
    @payload = payload
    @missing_teams = []
  end

  def call
    home = team_for(payload.fetch("homeTeam"))
    away = team_for(payload.fetch("awayTeam"))
    return if home.nil? || away.nil?

    game = Game.find_or_initialize_by(nhl_game_id: payload.fetch("id"))
    game.update!(attributes(home, away))
    game
  end

  private

  attr_reader :league, :payload

  def attributes(home, away)
    {
      season: season,
      home_team: home,
      away_team: away,
      game_type: payload.fetch("gameType"),
      starts_at: payload.fetch("startTimeUTC"),
      game_date: payload.fetch("gameDate"),
      venue: payload.dig("venue", "default"),
      neutral_site: payload.fetch("neutralSite", false),
      home_score: payload.dig("homeTeam", "score"),
      away_score: payload.dig("awayTeam", "score"),
      state: payload.fetch("gameState"),
      last_period_type: payload.dig("gameOutcome", "lastPeriodType")
    }
  end

  def season
    nhl_season_id = payload.fetch("season")

    league.seasons.find_by(nhl_season_id: nhl_season_id) ||
      raise(UnknownSeason, "No season #{nhl_season_id} — run SyncSeasons first")
  end

  # Abbreviation is the only identifier every payload carries; the numeric id is stored
  # opportunistically for endpoints that key on it.
  def team_for(side)
    abbreviation = side.fetch("abbrev")
    team = league.teams.find_by(abbreviation: abbreviation)

    if team.nil?
      missing_teams << abbreviation
      return
    end

    nhl_team_id = side["id"]
    team.update!(nhl_team_id: nhl_team_id) if nhl_team_id.present? && team.nhl_team_id != nhl_team_id

    team
  end
end
