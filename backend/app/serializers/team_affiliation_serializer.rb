class TeamAffiliationSerializer
  def initialize(affiliation)
    @affiliation = affiliation
  end

  def as_json(*)
    { id: affiliation.id, team: TeamSerializer.new(affiliation.affiliate_team, include_league: true).as_json }
  end

  private

  attr_reader :affiliation
end
