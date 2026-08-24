# Closes whatever RosterStatus period is currently open for the player (if any) and,
# unless the new status is "active" itself, opens a new one — "active" is never stored,
# so returning a player to active just closes the open period without replacing it.
class SetRosterStatus
  def initialize(player:, team:, season:, status:, effective_on:)
    @player = player
    @team = team
    @season = season
    @status = status
    @effective_on = effective_on
    @errors = []
  end

  attr_reader :result, :errors

  def call
    RosterStatus.transaction do
      close_open_period!
      open_new_period! if success? && !active?
      raise ActiveRecord::Rollback unless success?
    end

    self
  end

  def success?
    errors.empty?
  end

  private

  attr_reader :player, :team, :season, :status, :effective_on

  def active?
    status.blank? || status.to_s == "active"
  end

  def open_period
    @open_period ||= RosterStatus.open.find_by(player: player, team: team, season: season)
  end

  def close_open_period!
    return if open_period.nil?

    return if open_period.update(ended_on: effective_on)

    @errors = open_period.errors.full_messages
  end

  def open_new_period!
    new_period = RosterStatus.new(player: player, team: team, season: season,
                                   status: RosterStatus::STATUSES.fetch(status.to_sym), started_on: effective_on)

    if new_period.save
      @result = new_period
    else
      @errors = new_period.errors.full_messages
    end
  end
end
