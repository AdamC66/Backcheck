# The per-game computation RebuildAdvancedStatsForGame (TASK-62) assumes already
# happened: turns raw game_events/shifts into player_game_advanced_stats/
# team_game_advanced_stats rows. Recomputed wholesale via find_or_initialize_by, same
# as every other rollup in this schema — running this twice in a row never double-counts.
#
# Known gaps, left for a later task (see docs/DECISIONS.md): zone_entries/zone_exits
# stay at their column default, and toi_seconds is only computed for the all/all bucket.
class ComputeGameAdvancedStats
  CORSI_EVENT_TYPES = GameEvent::CORSI_EVENT_TYPES
  FENWICK_EVENT_TYPES = GameEvent::FENWICK_EVENT_TYPES

  STRENGTH_STATE_MAP = {
    GameEvent::STRENGTH_STATES[:even_strength] => PlayerGameAdvancedStat::STRENGTH_STATES[:five_v_five],
    GameEvent::STRENGTH_STATES[:power_play] => PlayerGameAdvancedStat::STRENGTH_STATES[:power_play],
    GameEvent::STRENGTH_STATES[:short_handed] => PlayerGameAdvancedStat::STRENGTH_STATES[:short_handed]
  }.freeze
  ALL = PlayerGameAdvancedStat::STRENGTH_STATES[:all]
  ALL_SCORE = PlayerGameAdvancedStat::SCORE_STATES[:all]
  CLOSE_SCORE = PlayerGameAdvancedStat::SCORE_STATES[:close]

  attr_reader :failures

  def initialize(game:)
    @game = game
    @xg_model = XgModel.active
    raise ArgumentError, "no active xg_model" if @xg_model.nil?

    @player_totals = Hash.new { |h, k| h[k] = zero_totals }
    @team_totals = Hash.new { |h, k| h[k] = zero_totals }
    @failures = []
  end

  def call
    accumulate_toi
    accumulate_events
    persist_player_rows
    persist_team_rows
  end

  private

  attr_reader :game, :xg_model, :player_totals, :team_totals

  # ixg is credited to the shooter only, so it stays 0 in every team_totals row and is
  # dropped in persist_team_rows.
  def zero_totals
    { corsi_for: 0, corsi_against: 0, fenwick_for: 0, fenwick_against: 0, xg_for: 0.0, xg_against: 0.0,
      ixg: 0.0, toi_seconds: 0 }
  end

  def skater_shifts
    @skater_shifts ||= Shift.where(game: game).includes(:player)
                           .reject { |shift| shift.player.position == Player::POSITIONS[:goalie] }
  end

  def player_team_ids
    @player_team_ids ||= skater_shifts.group_by(&:player_id).transform_values { |rows| rows.first.team_id }
  end

  # TOI for the all/all bucket only — see the class comment for why strength_state/
  # score_state splits aren't computed here.
  def accumulate_toi
    skater_shifts.each do |shift|
      key = [ shift.player_id, ALL, ALL_SCORE ]
      player_totals[key][:toi_seconds] += shift.end_time_seconds - shift.start_time_seconds
    end
  end

  def accumulate_events
    corsi_events.each { |event| accumulate_event(event) }
  end

  def corsi_events
    GameEvent.where(game: game, event_type: CORSI_EVENT_TYPES).where.not(team_id: nil).preload(:game)
  end

  def score_timeline
    @score_timeline ||= GameScoreTimeline.new(game)
  end

  def score_buckets_for(event)
    buckets = [ ALL_SCORE ]
    buckets << CLOSE_SCORE if score_timeline.close?(event)
    buckets
  end

  def accumulate_event(event)
    for_team_id = event.team_id
    against_team_id = for_team_id == game.home_team_id ? game.away_team_id : game.home_team_id
    strength_buckets = [ ALL, STRENGTH_STATE_MAP[event.strength_state] ].compact
    score_buckets = score_buckets_for(event)
    fenwick = FENWICK_EVENT_TYPES.include?(event.event_type)
    xg_value = fenwick ? xg_for(event) : 0.0
    on_ice = on_ice_skater_ids(event)

    strength_buckets.each do |strength_state|
      score_buckets.each do |score_state|
        credit_bucket(strength_state, score_state, for_team_id, against_team_id, on_ice,
                      fenwick: fenwick, xg_value: xg_value)
        credit_individual_xg(strength_state, score_state, event.primary_player_id, xg_value) if fenwick
      end
    end
  end

  # Individual xG: the shooter's own unblocked-attempt xG. Skip a shooter with no shift
  # in this game — persist_player_rows resolves each row's team from skater_shifts.
  def credit_individual_xg(strength_state, score_state, shooter_id, xg_value)
    return unless player_team_ids.key?(shooter_id)

    player_totals[[ shooter_id, strength_state, score_state ]][:ixg] += xg_value
  end

  def credit_bucket(strength_state, score_state, for_team_id, against_team_id, on_ice, fenwick:, xg_value:)
    credit(team_totals, [ for_team_id, strength_state, score_state ], fenwick: fenwick, xg_value: xg_value,
           side: :for)
    credit(team_totals, [ against_team_id, strength_state, score_state ], fenwick: fenwick, xg_value: xg_value,
           side: :against)

    on_ice.fetch(for_team_id, []).each do |player_id|
      credit(player_totals, [ player_id, strength_state, score_state ], fenwick: fenwick, xg_value: xg_value,
             side: :for)
    end
    on_ice.fetch(against_team_id, []).each do |player_id|
      credit(player_totals, [ player_id, strength_state, score_state ], fenwick: fenwick, xg_value: xg_value,
             side: :against)
    end
  end

  def credit(store, key, fenwick:, xg_value:, side:)
    totals = store[key]
    totals[:"corsi_#{side}"] += 1
    totals[:"fenwick_#{side}"] += 1 if fenwick
    totals[:"xg_#{side}"] += xg_value
  end

  # On ice = a shift covering this event's period_time_seconds in the same period —
  # not just the event's own team, and not just its named primary/secondary player.
  def on_ice_skater_ids(event)
    skater_shifts.select do |shift|
      shift.period == event.period &&
        shift.start_time_seconds <= event.period_time_seconds &&
        event.period_time_seconds < shift.end_time_seconds
    end.group_by(&:team_id).transform_values { |rows| rows.map(&:player_id) }
  end

  def xg_for(event)
    XgFormula.calculate(coefficients: xg_model.coefficients, event: event, rebound: rebounds.rebound?(event))
  end

  def rebounds
    @rebounds ||= ReboundShots.new(game)
  end

  # The object, not just the id — lets each row's team_played_in_game validate
  # without a query of its own (TASK-103's BulkUpsert validates every row in Ruby).
  def teams_by_id
    @teams_by_id ||= { game.home_team_id => game.home_team, game.away_team_id => game.away_team }
  end

  # Same reasoning as teams_by_id — skater_shifts already has each player preloaded.
  def players_by_id
    @players_by_id ||= skater_shifts.index_by(&:player_id).transform_values(&:player)
  end

  def persist_player_rows
    bulk = BulkUpsert.new(model: PlayerGameAdvancedStat, unique_by: %i[game_id player_id strength_state score_state])
    player_totals.each do |(player_id, strength_state, score_state), totals|
      bulk.add(PlayerGameAdvancedStat.new(game: game, player: players_by_id.fetch(player_id),
                                          team: teams_by_id.fetch(player_team_ids.fetch(player_id)),
                                          strength_state: strength_state, score_state: score_state,
                                          xg_model: xg_model, **totals))
    end
    bulk.call
    failures.concat(bulk.failures)
  end

  def persist_team_rows
    bulk = BulkUpsert.new(model: TeamGameAdvancedStat, unique_by: %i[game_id team_id strength_state score_state])
    team_totals.each do |(team_id, strength_state, score_state), totals|
      bulk.add(TeamGameAdvancedStat.new(game: game, team: teams_by_id.fetch(team_id),
                                        strength_state: strength_state, score_state: score_state,
                                        **totals.except(:ixg)))
    end
    bulk.call
    failures.concat(bulk.failures)
  end
end
