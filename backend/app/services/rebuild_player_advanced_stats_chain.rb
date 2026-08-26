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
      strength_states_to_rebuild.each { |strength_state| rebuild_chain(strength_state) }
    end
  end

  private

  attr_reader :player, :from_game, :season

  def strength_states_to_rebuild
    PlayerGameAdvancedStat.where(player: player, game: from_game).distinct.pluck(:strength_state)
  end

  # A player's actual games in the order they happened, not the team's schedule —
  # an affiliate call-up means their games aren't always sequential within one team's.
  def ordered_rows(strength_state)
    PlayerGameAdvancedStat.where(player: player, strength_state: strength_state)
                           .joins(:game).order("games.starts_at ASC").to_a
  end

  def rebuild_chain(strength_state)
    rows = ordered_rows(strength_state)
    from_index = rows.index { |row| row.game_id == from_game.id }
    return if from_index.nil?

    rows_from_here = rows[from_index..]
    prior_row = rows[from_index - 1] if from_index.positive?
    anchor = prior_row && PlayerSeasonAdvancedStat.find_by(
      player: player, season: season, strength_state: strength_state, as_of_game_id: prior_row.game_id
    )

    PlayerSeasonAdvancedStat.where(player: player, strength_state: strength_state,
                                    as_of_game_id: rows_from_here.map(&:game_id)).destroy_all

    running_totals = SUMMABLE_COLUMNS.index_with { |col| anchor&.public_send(col) || 0 }
    games_played = anchor&.games_played || 0

    rows_from_here.each do |pgas|
      games_played += 1
      running_totals = SUMMABLE_COLUMNS.index_with { |col| running_totals[col] + pgas.public_send(col) }

      PlayerSeasonAdvancedStat.create!(
        player: player, team: pgas.team, season: season, as_of_game: pgas.game,
        strength_state: strength_state, games_played: games_played, stale: false,
        **running_totals
      )
    end
  end
end
