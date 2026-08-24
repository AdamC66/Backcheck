class RosterTransactionSerializer
  STATUS_NAMES = RosterStatus::STATUSES.invert.freeze

  def initialize(roster_status)
    @roster_status = roster_status
  end

  def as_json(*)
    {
      player_id: roster_status.player_id,
      player_name: "#{roster_status.player.first_name} #{roster_status.player.last_name}",
      team_id: roster_status.team_id,
      team_name: roster_status.team.name,
      season: roster_status.season.label,
      status: STATUS_NAMES.fetch(roster_status.status).to_s,
      started_on: roster_status.started_on,
      ended_on: roster_status.ended_on
    }
  end

  private

  attr_reader :roster_status
end
