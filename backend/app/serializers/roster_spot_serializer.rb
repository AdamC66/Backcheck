class RosterSpotSerializer
  CONTRACT_LEVEL_NAMES = RosterSpot::CONTRACT_LEVELS.invert.freeze

  def initialize(roster_spot, assignment: nil)
    @roster_spot = roster_spot
    @assignment = assignment
  end

  def as_json(*)
    {
      player: PlayerSerializer.new(roster_spot.player).as_json,
      jersey_number: roster_spot.jersey_number,
      contract_level: CONTRACT_LEVEL_NAMES.fetch(roster_spot.contract_level).to_s,
      assignment: assignment_json
    }
  end

  private

  attr_reader :roster_spot, :assignment

  def assignment_json
    return nil if assignment.nil?

    {
      # include_league, unlike the top-level player entry: the whole point of this
      # field is telling AHL and ECHL assignments apart.
      team: TeamSerializer.new(assignment.team, include_league: true).as_json,
      contract_level: CONTRACT_LEVEL_NAMES.fetch(assignment.contract_level).to_s,
      contract_level_inferred: assignment.contract_level_inferred
    }
  end
end
