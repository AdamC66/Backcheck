# Pulls one team's whole season schedule in a single request. Every game comes back
# twice across a full league sync — once per team — which the upsert absorbs.
class SyncTeamSchedule
  attr_reader :missing_teams

  def initialize(team:, season:, client: NhlClient.new)
    @team = team
    @season = season
    @client = client
    @missing_teams = []
  end

  def call
    payload = client.club_schedule_season(team.abbreviation, season.nhl_season_id)

    payload.fetch("games").filter_map { |game| upsert(game) }
  end

  private

  attr_reader :team, :season, :client

  def upsert(game)
    upsert = UpsertGame.new(league: team.league, payload: game)
    result = upsert.call
    missing_teams.concat(upsert.missing_teams)

    result
  end
end
