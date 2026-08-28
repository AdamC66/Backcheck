class AdminSyncOrchestrator
  # These track progress per game rather than per team — one item can mean 82 games.
  PER_GAME_KINDS = %i[game_stats advanced_stats].freeze

  def initialize(sync_run:)
    @sync_run = sync_run
  end

  def call
    build_items
    sync_run.update!(status: SyncRun::STATUSES[:running], started_at: Time.current)
    sync_run.log("Run started (#{sync_run.total_steps} step(s))")

    sync_run.sync_run_items.order(:id).each do |item|
      if cancelled?
        sync_run.log("Run cancelled")
        break
      end

      run_item(item)
    end

    finalize!
  end

  private

  attr_reader :sync_run

  def build_items
    return if sync_run.sync_run_items.exists?

    sync_run.sync_kinds.each do |kind|
      teams_for(kind).each { |team| sync_run.sync_run_items.create!(kind: kind, team: team) }
    end

    sync_run.update!(total_steps: compute_total_steps)
  end

  # A per-game kind counts its actual games, not the one item that tracks them —
  # otherwise a team with 82 games finishing looks identical to one with 2.
  def compute_total_steps
    sync_run.sync_run_items.sum do |item|
      PER_GAME_KINDS.include?(item.kind_name) ? games_for(item.team).count : 1
    end
  end

  # nil means every game in the season, not "no games" — Game.for_team(nil) would
  # match nothing, so the team filter only applies when one was actually given.
  def games_for(team)
    scope = Game.for_season(sync_run.season).finished.chronological
    team ? scope.for_team(team) : scope
  end

  # A per-game kind gets exactly one item regardless of scope — games_for(team) is
  # already the whole season filtered down to one team when there is one, so fanning
  # out into one item per team would just process every shared game twice over.
  def teams_for(kind)
    return [ sync_run.team ] if PER_GAME_KINDS.include?(SyncKindRegistry.normalize(kind))
    return [ nil ] unless SyncKindRegistry.scope_axes(kind).include?(:team)
    return [ sync_run.team ] if sync_run.team

    sync_run.league.teams.to_a
  end

  # Re-reads from the DB rather than the in-memory sync_run, since a cancel
  # request lands via a separate web request updating the same row.
  def cancelled?
    sync_run.reload.status == SyncRun::STATUSES[:cancelled]
  end

  def run_item(item)
    item.update!(status: SyncRun::STATUSES[:running], started_at: Time.current)

    if PER_GAME_KINDS.include?(item.kind_name)
      run_per_game_item(item)
    else
      run_single_step_item(item)
    end
  end

  def run_single_step_item(item)
    label = label_for(item)
    sync_run.update!(current_step_label: label)
    sync_run.log("Starting #{label}")

    call_service(item)

    item.update!(status: SyncRun::STATUSES[:completed], finished_at: Time.current)
    sync_run.log("Completed #{label}")
    advance_step!
  rescue StandardError => e
    item.update!(status: SyncRun::STATUSES[:failed], finished_at: Time.current, error_message: e.message)
    sync_run.log("Failed #{label}: #{e.message}")
    advance_step!
  end

  # One item can mean every game in the season, so it gets its own cancellation
  # check and a step advance per game rather than per item.
  def run_per_game_item(item)
    games = games_for(item.team).to_a
    # Collected in memory and written once at the end (here and on cancel/error below)
    # rather than per-failure — one flaky game shouldn't cost a write on top of the
    # error itself, and TASK-90 needs every failure, not just whichever wrote last.
    failed_games = []
    # game_stats batches its season-stat recompute once per distinct player/team across
    # the whole item instead of once per game (TASK-88); advanced_stats' per-game
    # recompute is load-bearing (its rollups are a snapshot chain), so it stays as-is.
    recompute_batch = RecomputeTouchedSeasonStats.new(season: sync_run.season) if item.kind_name == :game_stats

    games.each_with_index do |game, index|
      if cancelled?
        item.update!(status: SyncRun::STATUSES[:cancelled], finished_at: Time.current, failed_games: failed_games)
        return
      end

      label = "#{item.kind_name.to_s.tr('_', ' ')} — #{matchup_label(game)} (#{index + 1}/#{games.size})"
      sync_run.update!(current_step_label: label)

      begin
        result = call_per_game_service(item.kind_name, game)
        result.each { |stat| recompute_batch.track(stat, game.game_type) } if recompute_batch
        sync_run.log("Completed #{label}")
      rescue StandardError => e
        failed_games << { "nhl_game_id" => game.nhl_game_id, "label" => matchup_label(game), "error" => e.message }
        sync_run.log("Failed #{label}: #{e.message}")
      end

      advance_step!
    end

    item.update!(status: failed_games.empty? ? SyncRun::STATUSES[:completed] : SyncRun::STATUSES[:failed],
                 finished_at: Time.current, failed_games: failed_games)
  ensure
    # In an ensure so a cancelled run still recomputes whatever it already touched,
    # not just a clean completion.
    recompute_batch&.call
  end

  def matchup_label(game)
    "#{game.away_team.abbreviation} @ #{game.home_team.abbreviation}"
  end

  def call_per_game_service(kind_name, game)
    case kind_name
    when :game_stats
      SyncGameStats.new(game: game, client: nhl_client, recompute: false).call
    when :advanced_stats
      SyncGameEvents.new(game: game, client: nhl_client, stats_client: nhl_stats_client).call
    end
  end

  # A raw UPDATE, not sync_run.increment!, so a concurrent writer's value is never
  # overwritten by whatever this process last loaded into memory.
  def advance_step!
    SyncRun.where(id: sync_run.id).update_all("current_step = current_step + 1")
    sync_run.reload
  end

  def finalize!
    sync_run.reload
    status = if sync_run.status == SyncRun::STATUSES[:cancelled]
      SyncRun::STATUSES[:cancelled]
    elsif sync_run.sync_run_items.where(status: SyncRun::STATUSES[:failed]).exists?
      SyncRun::STATUSES[:failed]
    else
      SyncRun::STATUSES[:completed]
    end

    sync_run.update!(status: status, finished_at: Time.current)
    sync_run.log("Run #{SyncRun::STATUSES.key(status)}")
  end

  def label_for(item)
    return item.kind_name.to_s.tr("_", " ") if item.team.nil?

    "#{item.kind_name.to_s.tr('_', ' ')} — #{item.team.name}"
  end

  def call_service(item)
    case item.kind_name
    when :team_roster
      SyncTeamRoster.new(team: item.team, client: nhl_client).call
    when :affiliate_roster
      SyncAffiliateRoster.new(team: item.team, client: hockey_tech_client(item.team)).call
    when :team_schedule
      SyncTeamSchedule.new(team: item.team, season: sync_run.season, client: nhl_client).call
    when :standings
      SyncStandings.new(league: sync_run.league, date: Date.current, client: nhl_client).call
    when :daily_scores
      SyncDailyScores.new(league: sync_run.league, date: Date.current, client: nhl_client).call
    end
  end

  def nhl_client
    @nhl_client ||= NhlClient.new(min_interval: sync_run.min_interval)
  end

  def nhl_stats_client
    @nhl_stats_client ||= NhlStatsClient.new(min_interval: sync_run.min_interval)
  end

  def hockey_tech_client(team)
    @hockey_tech_clients ||= {}
    @hockey_tech_clients[team.league_id] ||= HockeyTechClient.new(team.league.slug, min_interval: sync_run.min_interval)
  end
end
