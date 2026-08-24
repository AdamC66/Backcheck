class RosterStatus < ApplicationRecord
  # "active" is never stored — a player with no open row here is active by default.
  STATUSES = { injured_reserve: 0, non_roster: 1 }.freeze

  belongs_to :player
  belongs_to :team
  belongs_to :season

  validates :status, inclusion: { in: STATUSES.values }
  validates :started_on, presence: true
  validate :started_on_not_in_future
  validate :ended_on_not_before_started_on
  validate :only_one_open_period, if: -> { ended_on.nil? }

  scope :open, -> { where(ended_on: nil) }

  private

  def only_one_open_period
    return if player_id.blank? || team_id.blank? || season_id.blank?

    conflict = RosterStatus.open.where(player_id: player_id, team_id: team_id, season_id: season_id)
    conflict = conflict.where.not(id: id) if persisted?

    errors.add(:base, "already has an open roster status period for this team/season") if conflict.exists?
  end

  def started_on_not_in_future
    return if started_on.blank?

    errors.add(:started_on, "cannot be in the future") if started_on > Date.current
  end

  def ended_on_not_before_started_on
    return if started_on.blank? || ended_on.blank?

    errors.add(:ended_on, "must be on or after started_on") if ended_on < started_on
  end
end
