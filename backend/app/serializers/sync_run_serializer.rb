class SyncRunSerializer
  STATUS_NAMES = SyncRun::STATUSES.invert.freeze
  KIND_NAMES = SyncRun::SYNC_KINDS.invert.freeze

  def initialize(sync_run, include_items: false, include_log: false)
    @sync_run = sync_run
    @include_items = include_items
    @include_log = include_log
  end

  def as_json(*)
    payload = {
      id: sync_run.id,
      status: STATUS_NAMES.fetch(sync_run.status).to_s,
      sync_kinds: sync_run.sync_kinds.map { |kind| KIND_NAMES.fetch(kind).to_s },
      league_id: sync_run.league_id,
      season_id: sync_run.season_id,
      team_id: sync_run.team_id,
      total_steps: sync_run.total_steps,
      current_step: sync_run.current_step,
      current_step_label: sync_run.current_step_label,
      percent_complete: sync_run.percent_complete,
      min_interval: sync_run.min_interval,
      started_at: sync_run.started_at,
      finished_at: sync_run.finished_at,
      error_message: sync_run.error_message,
      triggered_by_id: sync_run.triggered_by_id
    }

    payload[:items] = sync_run.sync_run_items.includes(:team).order(:id).map { |item| SyncRunItemSerializer.new(item).as_json } if include_items
    payload[:activity_log] = sync_run.activity_log if include_log

    payload
  end

  private

  attr_reader :sync_run, :include_items, :include_log
end
