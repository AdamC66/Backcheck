# Re-points an existing roster_spots row at the destination team/season rather than opening a second row.
class ReassignPlayer
  def initialize(roster_spot:, destination_team:, destination_season:)
    @roster_spot = roster_spot
    @destination_team = destination_team
    @destination_season = destination_season
    @errors = []
  end

  attr_reader :errors

  def call
    if destination_conflict?
      @errors = [ "Player already has a roster spot on the destination team for this season" ]
      return self
    end

    roster_spot.assign_attributes(
      team: destination_team,
      season: destination_season,
      source: RosterSpot::SOURCES[:manual],
      contract_level: RosterSpot::CONTRACT_LEVELS[:unknown],
      contract_level_inferred: true
    )
    @errors = roster_spot.errors.full_messages unless roster_spot.save

    self
  end

  def success?
    errors.empty?
  end

  def result
    roster_spot
  end

  private

  attr_reader :roster_spot, :destination_team, :destination_season

  def destination_conflict?
    RosterSpot.where(player_id: roster_spot.player_id, team: destination_team, season: destination_season)
              .where.not(id: roster_spot.id).exists?
  end
end
