# The individual (not on-ice) counting stats derivable from game_events alone —
# faceoff wins/losses, shots personally attempted/missed/had blocked.
#
# recompute: :skip defers the season-stat rollup to the caller's own batch, same as
# RecomputeGoalieGamePoints (TASK-102).
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
    build_totals
    totals.map do |player_id, counts|
      row = SkaterGameStat.find_or_initialize_by(game: game, player_id: player_id)
      row.team_id ||= team_ids.fetch(player_id)
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
    @totals ||= Hash.new { |h, k| h[k] = zero_counts }
  end

  # Read off the events being counted, not a shift lookup — shift charts only cover
  # skaters, so a goalie has no shift row to fall back on (TASK-105).
  def team_ids
    @team_ids ||= {}
  end

  def build_totals
    faceoff_events.each do |event|
      totals[event.primary_player_id][:faceoff_wins] += 1
      team_ids[event.primary_player_id] ||= event.team_id
      next unless event.secondary_player_id

      totals[event.secondary_player_id][:faceoff_losses] += 1
      team_ids[event.secondary_player_id] ||= opposing_team_id(event)
    end

    shot_events.each do |event|
      shooter = totals[event.primary_player_id]
      shooter[:shots_attempted] += 1
      shooter[:missed_shots] += 1 if event.event_type == GameEvent::EVENT_TYPES[:missed_shot]
      shooter[:shots_blocked_against] += 1 if event.event_type == GameEvent::EVENT_TYPES[:blocked_shot]
      team_ids[event.primary_player_id] ||= event.team_id
    end
  end

  # A faceoff's own team_id is the winner's (primary_player's) — the loser
  # (secondary_player) is always on whichever of the game's two teams that isn't.
  def opposing_team_id(event)
    event.team_id == game.home_team_id ? game.away_team_id : game.home_team_id
  end

  def faceoff_events
    GameEvent.where(game: game, event_type: GameEvent::EVENT_TYPES[:faceoff])
  end

  def shot_events
    GameEvent.where(game: game, event_type: SHOT_EVENT_TYPES)
  end
end
