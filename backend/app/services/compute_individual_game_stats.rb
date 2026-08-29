# The individual (not on-ice) counting stats game_events alone can answer: faceoff
# wins/losses, and the shots a player personally attempted/missed/had blocked. Written
# onto the same SkaterGameStat row the box score populates — order-independent of
# SyncGameStats, since this only ever updates these columns, never the box-score ones.
#
# recompute: :skip for a bulk sync, same reasoning as RecomputeGoalieGamePoints
# (TASK-102): defers the season-stat rollup to the caller's own batch instead of once
# per game. Returns the touched SkaterGameStat rows either way.
class ComputeIndividualGameStats
  SHOT_EVENT_TYPES = [
    GameEvent::EVENT_TYPES[:goal], GameEvent::EVENT_TYPES[:shot],
    GameEvent::EVENT_TYPES[:missed_shot], GameEvent::EVENT_TYPES[:blocked_shot]
  ].freeze

  def initialize(game:, recompute: :async)
    @game = game
    @recompute = recompute
  end

  def call
    totals.map do |player_id, counts|
      row = SkaterGameStat.find_or_initialize_by(game: game, player_id: player_id)
      row.team_id ||= player_team_ids.fetch(player_id)
      row.update!(counts)

      RecomputeSeasonStats.new(player: row.player, team: row.team, season: game.season,
                                game_type: game.game_type).call unless recompute == :skip

      row
    end
  end

  private

  attr_reader :game, :recompute

  def zero_counts
    { faceoff_wins: 0, faceoff_losses: 0, shots_attempted: 0, missed_shots: 0, shots_blocked_against: 0 }
  end

  def totals
    totals = Hash.new { |h, k| h[k] = zero_counts }

    faceoff_events.each do |event|
      totals[event.primary_player_id][:faceoff_wins] += 1
      totals[event.secondary_player_id][:faceoff_losses] += 1 if event.secondary_player_id
    end

    shot_events.each do |event|
      shooter = totals[event.primary_player_id]
      shooter[:shots_attempted] += 1
      shooter[:missed_shots] += 1 if event.event_type == GameEvent::EVENT_TYPES[:missed_shot]
      shooter[:shots_blocked_against] += 1 if event.event_type == GameEvent::EVENT_TYPES[:blocked_shot]
    end

    totals
  end

  def faceoff_events
    GameEvent.where(game: game, event_type: GameEvent::EVENT_TYPES[:faceoff])
  end

  def shot_events
    GameEvent.where(game: game, event_type: SHOT_EVENT_TYPES)
  end

  # Shifts, not GameEvent's own team_id — a shooter/faceoff-taker's team is always on
  # the event already, but a row this service creates ahead of SyncGameStats has no
  # box-score team_id yet to fall back on.
  def player_team_ids
    @player_team_ids ||= Shift.where(game: game).group_by(&:player_id).transform_values { |rows| rows.first.team_id }
  end
end
