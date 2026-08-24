class RosterStatusSerializer
  STATUS_NAMES = RosterStatus::STATUSES.invert.freeze

  def initialize(roster_status)
    @roster_status = roster_status
  end

  def as_json(*)
    return { status: "active", started_on: nil } if roster_status.nil?

    { status: STATUS_NAMES.fetch(roster_status.status).to_s, started_on: roster_status.started_on }
  end

  private

  attr_reader :roster_status
end
