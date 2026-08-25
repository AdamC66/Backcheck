# Ensures player holds a roster_spot on team/season at the given contract_level —
# never deletes or relocates a row, only creates or re-tags one in place.
class SetRosterAssignment
  def initialize(player:, team:, season:, contract_level:)
    @player = player
    @team = team
    @season = season
    @contract_level = contract_level
    @errors = []
  end

  attr_reader :errors, :result

  def call
    spot = RosterSpot.find_or_initialize_by(player: player, team: team, season: season)
    spot.source = RosterSpot::SOURCES[:manual] if spot.new_record?
    spot.contract_level = RosterSpot::CONTRACT_LEVELS.fetch(contract_level)
    spot.contract_level_inferred = false

    if spot.save
      @result = spot
    else
      @errors = spot.errors.full_messages
    end

    self
  end

  def success?
    errors.empty?
  end

  private

  attr_reader :player, :team, :season, :contract_level
end
