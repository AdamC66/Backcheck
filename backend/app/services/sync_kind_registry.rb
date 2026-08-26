module SyncKindRegistry
  # Scope axes tell callers (orchestrator, trigger form) what to resolve before
  # running a kind — so the UI never offers a team picker for a kind with none.
  DEFINITIONS = {
    team_roster: { service: SyncTeamRoster, scope: [ :team ] },
    affiliate_roster: { service: SyncAffiliateRoster, scope: [ :team ] },
    team_schedule: { service: SyncTeamSchedule, scope: [ :team, :season ] },
    standings: { service: SyncStandings, scope: [ :league, :date ] },
    daily_scores: { service: SyncDailyScores, scope: [ :league, :date ] },
    # SyncGameStats itself takes a single game, but the admin trigger tracks progress
    # per team: one item means "resync every finished game this team/season has."
    game_stats: { service: SyncGameStats, scope: [ :team, :season ] },
    # Recompute-only, same as a corrected-game trigger (MarkGameForStatsRecompute) —
    # not a new NHL API integration.
    advanced_stats: { service: MarkGameForStatsRecompute, scope: [ :team, :season ] }
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
