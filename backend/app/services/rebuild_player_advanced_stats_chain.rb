# Deletes the stale tail and reinserts it, chained off the last untouched snapshot,
# rather than incrementing in place. That's what makes re-running this after a partial
# failure safe: the tail is always fully re-derived from the same source rows, never added to.
class RebuildPlayerAdvancedStatsChain
  SUMMABLE_COLUMNS = %i[
    corsi_for corsi_against fenwick_for fenwick_against
    xg_for xg_against zone_entries zone_exits toi_seconds
  ].freeze

  def initialize(player:, from_game:)
    @player = player
    @from_game = from_game
    @season = from_game.season
  end

  def call
    ActiveRecord::Base.transaction do
      dimensions_to_rebuild.each { |strength_state, score_state| rebuild_chain(strength_state, score_state) }
    end
  end

  private

  attr_reader :player, :from_game, :season

  def dimensions_to_rebuild
    PlayerGameAdvancedStat.where(player: player, game: from_game).distinct.pluck(:strength_state, :score_state)
  end

  # A player's actual games in order, not the team's schedule (a call-up skips games).
  # Scoped to from_game's game_type: a playoff correction never touches the regular chain.
  def ordered_rows(strength_state, score_state)
    PlayerGameAdvancedStat.where(player: player, strength_state: strength_state, score_state: score_state)
                           .joins(:game).where(games: { game_type: from_game.game_type })
                           .order("games.starts_at ASC").to_a
  end

  def rebuild_chain(strength_state, score_state)
    rows = ordered_rows(strength_state, score_state)
    from_index = rows.index { |row| row.game_id == from_game.id }
    return if from_index.nil?

    rows_from_here = rows[from_index..]
    prior_row = rows[from_index - 1] if from_index.positive?
    anchor = prior_row && PlayerSeasonAdvancedStat.find_by(
      player: player, season: season, strength_state: strength_state, score_state: score_state,
      game_type: from_game.game_type, as_of_game_id: prior_row.game_id
    )

    PlayerSeasonAdvancedStat.where(player: player, strength_state: strength_state, score_state: score_state,
                                    game_type: from_game.game_type,
                                    as_of_game_id: rows_from_here.map(&:game_id)).destroy_all

    running_totals = SUMMABLE_COLUMNS.index_with { |col| anchor&.public_send(col) || 0 }
    games_played = anchor&.games_played || 0

    rows_from_here.each do |pgas|
      games_played += 1
      running_totals = SUMMABLE_COLUMNS.index_with { |col| running_totals[col] + pgas.public_send(col) }

      PlayerSeasonAdvancedStat.create!(
        player: player, team: pgas.team, season: season, as_of_game: pgas.game,
        strength_state: strength_state, score_state: score_state, game_type: from_game.game_type,
        games_played: games_played, stale: false,
        **running_totals
      )
    end
  end
end
