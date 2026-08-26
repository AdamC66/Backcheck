class SyncRun < ApplicationRecord
  # Canonical enum backing both this array column and SyncRunItem#kind, so the
  # int values live in one place rather than being duplicated per model.
  SYNC_KINDS = {
    team_roster: 0,
    affiliate_roster: 1,
    team_schedule: 2,
    standings: 3,
    daily_scores: 4,
    game_stats: 5
  }.freeze

  # SyncRunItem#status validates against this same set rather than defining its own.
  STATUSES = {
    queued: 0,
    running: 1,
    completed: 2,
    failed: 3,
    cancelled: 4
  }.freeze

  belongs_to :league, optional: true
  belongs_to :season, optional: true
  belongs_to :team, optional: true
  belongs_to :triggered_by, class_name: "User"

  has_many :sync_run_items, dependent: :destroy

  validates :sync_kinds, presence: true
  validates :status, inclusion: { in: STATUSES.values }
  validates :min_interval, presence: true
  validate :sync_kinds_are_known

  def percent_complete
    return 0 if total_steps.zero?

    (current_step.to_f / total_steps * 100).round
  end

  private

  def sync_kinds_are_known
    unknown = sync_kinds.to_a - SYNC_KINDS.values
    return if unknown.empty?

    errors.add(:sync_kinds, "contains unknown kind(s): #{unknown.join(', ')}")
  end
end
