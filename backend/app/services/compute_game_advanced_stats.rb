# The per-game computation RebuildAdvancedStatsForGame (TASK-62) assumes already
# happened: turns raw game_events/shifts into player_game_advanced_stats/
# team_game_advanced_stats rows. Recomputed wholesale via find_or_initialize_by, same
# as every other rollup in this schema — running this twice in a row never double-counts.
#
# Known gaps, left for a later task (see docs/DECISIONS.md): zone_entries/zone_exits
# stay at their column default, and toi_seconds is only computed for the all/all bucket.
class ComputeGameAdvancedStats
  CORSI_EVENT_TYPES = [
    GameEvent::EVENT_TYPES[:goal], GameEvent::EVENT_TYPES[:shot],
    GameEvent::EVENT_TYPES[:missed_shot], GameEvent::EVENT_TYPES[:blocked_shot]
  ].freeze

  # xG is scored on unblocked attempts only — a blocked shot's recorded coordinates
  # are the blocker's position, not the shooter's release point.
  FENWICK_EVENT_TYPES = (CORSI_EVENT_TYPES - [ GameEvent::EVENT_TYPES[:blocked_shot] ]).freeze

  STRENGTH_STATE_MAP = {
    GameEvent::STRENGTH_STATES[:even_strength] => PlayerGameAdvancedStat::STRENGTH_STATES[:five_v_five],
    GameEvent::STRENGTH_STATES[:power_play] => PlayerGameAdvancedStat::STRENGTH_STATES[:power_play],
    GameEvent::STRENGTH_STATES[:short_handed] => PlayerGameAdvancedStat::STRENGTH_STATES[:short_handed]
  }.freeze
  ALL = PlayerGameAdvancedStat::STRENGTH_STATES[:all]
  ALL_SCORE = PlayerGameAdvancedStat::SCORE_STATES[:all]
  CLOSE_SCORE = PlayerGameAdvancedStat::SCORE_STATES[:close]

  def initialize(game:)
    @game = game
    @xg_model = XgModel.active
    raise ArgumentError, "no active xg_model" if @xg_model.nil?

    @player_totals = Hash.new { |h, k| h[k] = zero_totals }
    @team_totals = Hash.new { |h, k| h[k] = zero_totals }
  end

  def call
    accumulate_toi
    accumulate_events
    persist_player_rows
    persist_team_rows
  end

  private

  attr_reader :game, :xg_model, :player_totals, :team_totals

  def zero_totals
    { corsi_for: 0, corsi_against: 0, fenwick_for: 0, fenwick_against: 0, xg_for: 0.0, xg_against: 0.0,
      toi_seconds: 0 }
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
    GameEvent.where(game: game, event_type: CORSI_EVENT_TYPES).where.not(team_id: nil)
  end

  # goal-type events in chronological order, used to reconstruct the score entering
  # any other event — "entering", not after, so a tying goal is itself still scored
  # under the pre-goal (closer) score state.
  def goal_events
    @goal_events ||= GameEvent.where(game: game, event_type: GameEvent::EVENT_TYPES[:goal])
                              .order(:period, :period_time_seconds, :id).to_a
  end

  def score_before(event)
    key = [ event.period, event.period_time_seconds, event.id ]
    home = 0
    away = 0

    goal_events.each do |goal|
      break if ([ goal.period, goal.period_time_seconds, goal.id ] <=> key) >= 0

      home += 1 if goal.team_id == game.home_team_id
      away += 1 if goal.team_id == game.away_team_id
    end

    [ home, away ]
  end

  # "close" = within one goal in the 1st/2nd, tied in the 3rd, all of OT regardless
  # of margin — see PlayerGameAdvancedStat::SCORE_STATES.
  def close?(event, home_score, away_score)
    diff = (home_score - away_score).abs
    return true if event.period >= 4
    return diff <= 1 if event.period <= 2

    diff.zero?
  end

  def score_buckets_for(event)
    home_score, away_score = score_before(event)
    buckets = [ ALL_SCORE ]
    buckets << CLOSE_SCORE if close?(event, home_score, away_score)
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
      end
    end
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
    XgFormula.calculate(coefficients: xg_model.coefficients, x_coord: event.x_coord, y_coord: event.y_coord,
                        target_net_x: target_net_x_for(event))
  end

  # The net a shot is aimed at, not the shooter's own — home's net sits on
  # home_team_defending_side; away shoots at that side, home shoots at the opposite one.
  def target_net_x_for(event)
    return nil if event.home_team_defending_side.blank? || event.team_id.nil?

    home_net_x = event.home_team_defending_side == GameEvent::DEFENDING_SIDES[:left] ? -XgFormula::HALF_RINK_X : XgFormula::HALF_RINK_X
    event.team_id == game.home_team_id ? -home_net_x : home_net_x
  end

  def persist_player_rows
    player_totals.each do |(player_id, strength_state, score_state), totals|
      row = PlayerGameAdvancedStat.find_or_initialize_by(game: game, player_id: player_id,
                                                          strength_state: strength_state, score_state: score_state)
      row.team_id = player_team_ids.fetch(player_id)
      row.xg_model = xg_model
      row.assign_attributes(totals)
      row.save!
    end
  end

  def persist_team_rows
    team_totals.each do |(team_id, strength_state, score_state), totals|
      row = TeamGameAdvancedStat.find_or_initialize_by(game: game, team_id: team_id, strength_state: strength_state,
                                                        score_state: score_state)
      row.assign_attributes(totals)
      row.save!
    end
  end
end
