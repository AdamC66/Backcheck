class ComputeGameZoneTime
  START_FACEOFF_WINDOW_SECONDS = 2

  ZONE_SECONDS = { offensive: :offensive_seconds, neutral: :neutral_seconds, defensive: :defensive_seconds }.freeze
  ZONE_STARTS = { offensive: :offensive_starts, neutral: :neutral_starts, defensive: :defensive_starts }.freeze

  attr_reader :failures

  def initialize(game:)
    @game = game
    @failures = []
  end

  def call
    accumulate
    persist
    PlayerGameZoneTime.where(game: game, player_id: totals.keys).includes(:player, :team).to_a
  end

  private

  attr_reader :game

  def timeline
    @timeline ||= ZoneOccupancyTimeline.new(game)
  end

  def skater_shifts
    @skater_shifts ||= Shift.where(game: game).includes(:player)
                           .reject { |shift| shift.player.position == Player::POSITIONS[:goalie] }
  end

  def faceoffs_by_period
    @faceoffs_by_period ||= GameEvent.where(game: game, event_type: GameEvent::EVENT_TYPES[:faceoff])
                                     .group_by(&:period)
  end

  def totals
    @totals ||= Hash.new do |hash, player_id|
      hash[player_id] = ZONE_SECONDS.values.index_with(0).merge(ZONE_STARTS.values.index_with(0))
                                    .merge(on_the_fly_starts: 0)
    end
  end

  def teams_by_id
    @teams_by_id ||= { game.home_team_id => game.home_team, game.away_team_id => game.away_team }
  end

  def player_team_ids
    @player_team_ids ||= skater_shifts.group_by(&:player_id).transform_values { |rows| rows.first.team_id }
  end

  def players_by_id
    @players_by_id ||= skater_shifts.index_by(&:player_id).transform_values(&:player)
  end

  def accumulate
    skater_shifts.each do |shift|
      row = totals[shift.player_id]

      durations = timeline.zone_durations(period: shift.period, from_seconds: shift.start_time_seconds,
                                          to_seconds: shift.end_time_seconds, team_id: shift.team_id)
      ZONE_SECONDS.each { |zone, column| row[column] += durations[zone] }

      start_zone = start_zone_for(shift)
      row[start_zone ? ZONE_STARTS.fetch(start_zone) : :on_the_fly_starts] += 1
    end
  end

  def start_zone_for(shift)
    faceoff = (faceoffs_by_period[shift.period] || []).find do |event|
      (event.period_time_seconds - shift.start_time_seconds).abs <= START_FACEOFF_WINDOW_SECONDS
    end
    return if faceoff.nil?

    timeline.puck_zone_for(faceoff, team_id: shift.team_id)
  end

  def persist
    bulk = BulkUpsert.new(model: PlayerGameZoneTime, unique_by: %i[game_id player_id])
    totals.each do |player_id, counts|
      bulk.add(PlayerGameZoneTime.new(game: game, player: players_by_id.fetch(player_id),
                                      team: teams_by_id.fetch(player_team_ids.fetch(player_id)), **counts))
    end
    bulk.call
    failures.concat(bulk.failures)
  end
end
