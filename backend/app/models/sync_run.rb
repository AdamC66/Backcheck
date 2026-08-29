class SyncRun < ApplicationRecord
  # Canonical enum backing both this array column and SyncRunItem#kind, so the
  # int values live in one place rather than being duplicated per model.
  SYNC_KINDS = {
    team_roster: 0,
    affiliate_roster: 1,
    team_schedule: 2,
    standings: 3,
    daily_scores: 4,
    game_stats: 5,
    advanced_stats: 6,
    rebuild_season_stats: 7
  }.freeze

  # SyncRunItem#status validates against this same set rather than defining its own.
  # completed_with_errors: some but not all games/items failed — failed is reserved
  # for total failure, so one flaky game doesn't read the same as all of them (TASK-91).
  STATUSES = {
    queued: 0,
    running: 1,
    completed: 2,
    failed: 3,
    cancelled: 4,
    completed_with_errors: 5
  }.freeze

  # Matches NhlClient/HockeyTechClient's own DEFAULT_MIN_INTERVAL (0.5) as "normal".
  MIN_INTERVAL_PRESETS = {
    conservative: 1.0,
    normal: 0.5,
    aggressive: 0.25
  }.freeze

  ACTIVITY_LOG_LIMIT = 200

  belongs_to :league, optional: true
  belongs_to :season, optional: true
  belongs_to :team, optional: true
  belongs_to :triggered_by, class_name: "User"

  has_many :sync_run_items, dependent: :destroy

  validates :sync_kinds, presence: true
  validates :status, inclusion: { in: STATUSES.values }
  validates :min_interval, presence: true
  validate :sync_kinds_are_known

  # A property of the row existing, not a separate step a caller can skip or
  # have fail independently of the save (TASK-97).
  after_create_commit :enqueue_orchestrator_job

  def percent_complete
    return 0 if total_steps.zero?

    (current_step.to_f / total_steps * 100).round
  end

  # No log aggregator exists in this app (see DECISIONS.md), so a run's own history
  # lives on the row itself — capped, since a long run shouldn't grow this unbounded.
  def log(message)
    entries = activity_log + [ { "at" => Time.current.iso8601, "message" => message } ]
    update!(activity_log: entries.last(ACTIVITY_LOG_LIMIT))
  end

  private

  def enqueue_orchestrator_job
    AdminSyncOrchestratorJob.perform_later(id)
  end

  def sync_kinds_are_known
    unknown = sync_kinds.to_a - SYNC_KINDS.values
    return if unknown.empty?

    errors.add(:sync_kinds, "contains unknown kind(s): #{unknown.join(', ')}")
  end
end
