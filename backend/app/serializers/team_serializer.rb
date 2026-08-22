class TeamSerializer
  include LogoUrl

  def initialize(team)
    @team = team
  end

  def as_json(*)
    {
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      logo_url: logo_url(team),
      primary_color: team.primary_color,
      secondary_color: team.secondary_color,
      tertiary_color: team.tertiary_color
    }
  end

  private

  attr_reader :team
end
