class CreateSyncRun
  def initialize(triggered_by:, sync_kinds:, league: nil, season: nil, team: nil, min_interval_preset: "normal")
    @triggered_by = triggered_by
    @requested_kinds = Array(sync_kinds).map(&:to_s)
    @league = league
    @season = season
    @team = team
    @min_interval_preset = min_interval_preset
    @errors = []
  end

  attr_reader :result, :errors

  def call
    resolve_kinds
    validate_scope if success?
    build_run if success?

    self
  end

  def success?
    errors.empty?
  end

  private

  attr_reader :triggered_by, :requested_kinds, :league, :season, :team, :min_interval_preset, :resolved_kinds

  def resolve_kinds
    if requested_kinds.empty?
      errors << "sync_kinds is required"
      return
    end

    @resolved_kinds = requested_kinds.filter_map do |name|
      SyncRun::SYNC_KINDS.fetch(name.to_sym) do
        errors << "unknown sync kind: #{name}"
        nil
      end
    end
  end

  # A kind's required axes come from the same registry the orchestrator resolves
  # scope with, so a run can never be created asking for something it can't run.
  def validate_scope
    resolved_kinds.each do |kind|
      axes = SyncKindRegistry.scope_axes(kind)
      name = SyncKindRegistry.normalize(kind)

      errors << "#{name} requires a league or a team" if axes.include?(:team) && league.blank? && team.blank?
      errors << "#{name} requires a league" if axes.include?(:league) && league.blank?
      errors << "#{name} requires a season" if axes.include?(:season) && season.blank?
    end
  end

  def build_run
    run = SyncRun.new(triggered_by: triggered_by, sync_kinds: resolved_kinds, league: league,
                       season: season, team: team, min_interval: min_interval)

    if run.save
      AdminSyncOrchestratorJob.perform_later(run.id)
      @result = run
    else
      @errors = run.errors.full_messages
    end
  end

  def min_interval
    SyncRun::MIN_INTERVAL_PRESETS.fetch(min_interval_preset.to_s.to_sym, SyncRun::MIN_INTERVAL_PRESETS[:normal])
  end
end
