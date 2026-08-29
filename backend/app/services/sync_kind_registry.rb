module SyncKindRegistry
  # Scope axes tell callers (orchestrator, trigger form) what to resolve before
  # running a kind — so the UI never offers a team picker for a kind with none.
  DEFINITIONS = {
    team_roster: { service: SyncTeamRoster, scope: [ :team ] },
    affiliate_roster: { service: SyncAffiliateRoster, scope: [ :team ] },
    team_schedule: { service: SyncTeamSchedule, scope: [ :team, :season ] },
    standings: { service: SyncStandings, scope: [ :league, :date ] },
    daily_scores: { service: SyncDailyScores, scope: [ :league, :date ] },
    # SyncGameStats itself takes a single game; the admin trigger runs it as one item
    # covering every finished game in scope (the whole season, or one team's slice of
    # it), not one item per team (TASK-85).
    game_stats: { service: SyncGameStats, scope: [ :team, :season ] },
    # Real ingestion (TASK-76) — SyncGameEvents itself hands off to
    # MarkGameForStatsRecompute, the same corrected-game recompute path.
    advanced_stats: { service: SyncGameEvents, scope: [ :team, :season ] },
    # No NHL API call — recomputes individual/season stats from game_events already
    # ingested. Self-service re-run for whenever a new stat calc needs backfilling
    # into a season that's already fully synced (TASK-105).
    rebuild_season_stats: { service: ComputeIndividualGameStats, scope: [ :team, :season ] }
  }.freeze

  def self.for(kind)
    DEFINITIONS.fetch(normalize(kind)) { raise ArgumentError, "unknown sync kind: #{kind.inspect}" }
  end

  def self.scope_axes(kind)
    self.for(kind).fetch(:scope)
  end

  def self.service_for(kind)
    self.for(kind).fetch(:service)
  end

  # A stored SyncRunItem#kind is an int; callers also pass the symbol form directly.
  def self.normalize(kind)
    return kind if DEFINITIONS.key?(kind)

    SyncRun::SYNC_KINDS.key(kind)
  end
end
