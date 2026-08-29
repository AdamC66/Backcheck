class AdminSyncOrchestrator
  # These track progress per game rather than per team — one item can mean 82 games.
  PER_GAME_KINDS = %i[game_stats advanced_stats].freeze

  def initialize(sync_run:)
    @sync_run = sync_run
  end

  def call
    # A dead worker process's claimed job gets released and re-run by Solid Queue's
    # own supervisor (TASK-84) — build_items already no-ops once items exist, so the
    # only other thing a resumed run needs is to not redo work already marked done.
    resuming = sync_run.sync_run_items.exists?
    build_items
    reset_current_step! if resuming
    sync_run.update!(status: SyncRun::STATUSES[:running], started_at: Time.current)
    sync_run.log(resuming ? "Run resumed (#{sync_run.total_steps} step(s))" : "Run started (#{sync_run.total_steps} step(s))")

    sync_run.sync_run_items.order(:id).each do |item|
      if cancelled?
        sync_run.log("Run cancelled")
        break
      end

      next if item.status == SyncRun::STATUSES[:completed]

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
    sync_run.sync_run_items.sum { |item| step_weight(item) }
  end

  # A raw incrementing counter has no reset point across a restart — recompute it
  # from real completed work instead of trusting whatever it last held (TASK-96).
  def reset_current_step!
    done_steps = sync_run.sync_run_items.where(status: SyncRun::STATUSES[:completed])
                          .to_a.sum { |item| step_weight(item) }
    SyncRun.where(id: sync_run.id).update_all(current_step: done_steps)
  end

  def step_weight(item)
    PER_GAME_KINDS.include?(item.kind_name) ? games_for(item.team).count : 1
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
  # request lands via a separate web request updating the same row — pick, not
  # reload, since this runs once per game and only ever needs the one column.
  def cancelled?
    SyncRun.where(id: sync_run.id).pick(:status) == SyncRun::STATUSES[:cancelled]
  end

  def run_item(item)
    item.update!(status: SyncRun::STATUSES[:running], started_at: Time.current)

    if PER_GAME_KINDS.include?(item.kind_name)
      run_per_game_item(item)
    else
      run_single_step_item(item)
    end
  end

  # No mid-call cancellation check here, unlike the per-game loop — accepted, these
  # are single fast/atomic calls, not worth threading a check through (TASK-98).
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
    # Both kinds batch their season-stat recompute once per distinct player/team touched
    # across the whole item instead of once per game — game_stats' skaters/goalies
    # (TASK-88), advanced_stats' goalies via RecomputeGoalieGamePoints (TASK-102).
    # advanced_stats also batches its season-chain rebuild the same way (TASK-94).
    recompute_batch = RecomputeTouchedSeasonStats.new(season: sync_run.season) if PER_GAME_KINDS.include?(item.kind_name)
    chain_batch = RebuildTouchedAdvancedStatsChains.new(season: sync_run.season) if item.kind_name == :advanced_stats

    games.each_with_index do |game, index|
      if cancelled?
        item.update!(status: SyncRun::STATUSES[:cancelled], finished_at: Time.current, failed_games: failed_games)
        return
      end

      label = "#{item.kind_name.to_s.tr('_', ' ')} — #{matchup_label(game)} (#{index + 1}/#{games.size})"
      sync_run.update!(current_step_label: label)

      result = sync_game(item.kind_name, game, label, failed_games)
      track_game(result, game, recompute_batch, chain_batch, label) unless result.nil?

      advance_step!
    end

    item.update!(status: item_status(failed_games, games), finished_at: Time.current, failed_games: failed_games)
  ensure
    # In an ensure so a cancelled run still recomputes whatever it already touched,
    # not just a clean completion.
    run_batch(recompute_batch)
    run_batch(chain_batch)
  end

  # Each batcher rescues its own per-row failures already (TASK-104) — this guards
  # the rarer case where the batch's own setup query fails outright instead.
  def run_batch(batch)
    return unless batch

    batch.call
  rescue StandardError => e
    sync_run.log("Warning: batch recompute failed: #{e.message}")
  ensure
    batch&.failures&.each { |failure| sync_run.log("Warning: #{failure}") }
  end

  def sync_game(kind_name, game, label, failed_games)
    result = call_per_game_service(kind_name, game)
    sync_run.log("Completed #{label}")
    result
  rescue StandardError => e
    failed_games << { "nhl_game_id" => game.nhl_game_id, "label" => matchup_label(game), "error" => e.message }
    sync_run.log("Failed #{label}: #{e.message}")
    nil
  end

  # A separate rescue from the sync call itself (TASK-98) — a tracking-query hiccup
  # shouldn't get recorded as this game's own sync failing when it didn't.
  def track_game(result, game, recompute_batch, chain_batch, label)
    result.each { |stat| recompute_batch.track(stat, game.game_type) } if recompute_batch
    chain_batch&.track(game)
  rescue StandardError => e
    sync_run.log("Warning: recompute tracking failed for #{label}: #{e.message}")
  end

  # failed only for total failure (every game in scope errored) — TASK-91.
  def item_status(failed_games, games)
    return SyncRun::STATUSES[:completed] if failed_games.empty?
    return SyncRun::STATUSES[:failed] if failed_games.size == games.size

    SyncRun::STATUSES[:completed_with_errors]
  end

  def matchup_label(game)
    "#{game.away_team.abbreviation} @ #{game.home_team.abbreviation}"
  end

  def call_per_game_service(kind_name, game)
    case kind_name
    when :game_stats
      SyncGameStats.new(game: game, client: nhl_client, recompute: false).call
    when :advanced_stats
      sync = SyncGameEvents.new(game: game, client: nhl_client, stats_client: nhl_stats_client, recompute: :skip)
      sync.call
      sync.goalie_stats
    end
  end

  # A raw UPDATE, not sync_run.increment!, so a concurrent writer's value is never
  # overwritten by whatever this process last loaded into memory. No reload after —
  # runs once per game, and nothing downstream reads current_step off this instance
  # (finalize! reloads its own copy before it needs one).
  def advance_step!
    SyncRun.where(id: sync_run.id).update_all("current_step = current_step + 1")
  end

  def finalize!
    sync_run.reload
    status = sync_run.status == SyncRun::STATUSES[:cancelled] ? SyncRun::STATUSES[:cancelled] : run_status

    sync_run.update!(status: status, finished_at: Time.current)
    sync_run.log("Run #{SyncRun::STATUSES.key(status)}")
  end

  # failed only when every item failed outright — one flaky item alongside others
  # that succeeded reads as completed_with_errors instead (TASK-91).
  def run_status
    item_statuses = sync_run.sync_run_items.pluck(:status)
    errored = [ SyncRun::STATUSES[:failed], SyncRun::STATUSES[:completed_with_errors] ]

    return SyncRun::STATUSES[:completed] if item_statuses.none? { |s| errored.include?(s) }
    return SyncRun::STATUSES[:failed] if item_statuses.all? { |s| s == SyncRun::STATUSES[:failed] }

    SyncRun::STATUSES[:completed_with_errors]
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
