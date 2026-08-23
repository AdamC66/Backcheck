class TeamSerializer
  include LogoUrl

  # Opt-in, because the collections that embed teams (standings rows, a league's roster
  # of teams) already know the league and would repeat it 32 times.
  def initialize(team, include_league: false)
    @team = team
    @include_league = include_league
  end

  def as_json(*)
    payload = {
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      nhl_team_id: team.nhl_team_id,
      logo_url: logo_url(team),
      primary_color: team.primary_color,
      secondary_color: team.secondary_color,
      tertiary_color: team.tertiary_color
    }

    return payload unless include_league

    payload.merge(league: LeagueSerializer.new(team.league).as_json)
  end

  private

  attr_reader :team, :include_league
end
