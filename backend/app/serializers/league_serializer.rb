class LeagueSerializer
  include LogoUrl

  def initialize(league, include_teams: false)
    @league = league
    @include_teams = include_teams
  end

  def as_json(*)
    payload = {
      id: league.id,
      name: league.name,
      slug: league.slug,
      abbreviation: league.abbreviation,
      tier: league.tier,
      logo_url: logo_url(league)
    }

    return payload unless include_teams

    payload.merge(teams: teams.map { |team| TeamSerializer.new(team).as_json })
  end

  private

  attr_reader :league, :include_teams

  def teams
    league.teams.alphabetical.with_logo
  end
end
