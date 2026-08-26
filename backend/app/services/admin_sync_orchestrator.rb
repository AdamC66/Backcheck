class AdminSyncOrchestrator
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

  # game_stats counts its actual games, not the one item that tracks them — otherwise
  # a team with 82 games finishing looks identical to one with 2.
  def compute_total_steps
    sync_run.sync_run_items.sum do |item|
      item.kind_name == :game_stats ? games_for(item.team).count : 1
    end
  end

  def games_for(team)
    Game.for_team(team).for_season(sync_run.season).finished.chronological
  end

  def teams_for(kind)
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

    if item.kind_name == :game_stats
      run_game_stats_item(item)
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

  # One item can mean 82 games, so it gets its own cancellation check and a step
  # advance per game — the same "X/Y" progress the other kinds get per team.
  def run_game_stats_item(item)
    games = games_for(item.team).to_a
    failed = false

    games.each_with_index do |game, index|
      if cancelled?
        item.update!(status: SyncRun::STATUSES[:cancelled], finished_at: Time.current)
        return
      end

      label = "game stats — #{item.team.name} (#{index + 1}/#{games.size})"
      sync_run.update!(current_step_label: label)

      begin
        SyncGameStats.new(game: game, client: nhl_client).call
        sync_run.log("Completed #{label}")
      rescue StandardError => e
        failed = true
        item.update!(error_message: e.message)
        sync_run.log("Failed #{label}: #{e.message}")
      end

      advance_step!
    end

    item.update!(status: failed ? SyncRun::STATUSES[:failed] : SyncRun::STATUSES[:completed],
                 finished_at: Time.current)
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

  def hockey_tech_client(team)
    @hockey_tech_clients ||= {}
    @hockey_tech_clients[team.league_id] ||= HockeyTechClient.new(team.league.slug, min_interval: sync_run.min_interval)
  end
end
