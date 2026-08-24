class RosterStatusSerializer
  STATUS_NAMES = RosterStatus::STATUSES.invert.freeze

  def initialize(player, roster_status)
    @player = player
    @roster_status = roster_status
  end

  def as_json(*)
    return { player_id: player.id, status: "active", started_on: nil } if roster_status.nil?

    {
      player_id: player.id,
      status: STATUS_NAMES.fetch(roster_status.status).to_s,
      started_on: roster_status.started_on
    }
  end

  private

  attr_reader :player, :roster_status
end
