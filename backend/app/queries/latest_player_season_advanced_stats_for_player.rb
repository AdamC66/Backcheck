# Same running-total-chain rationale as LatestPlayerSeasonAdvancedStats (TASK-61), but
# scoped to one player across every season/team, not one team+season across every player.
class LatestPlayerSeasonAdvancedStatsForPlayer
  def initialize(player:, game_type:)
    @player = player
    @game_type = game_type
  end

  def call
    rows.group_by { |row| [ row.season_id, row.team_id, row.strength_state, row.score_state ] }
        .values
        .map { |group| group.max_by { |row| row.as_of_game.starts_at } }
  end

  private

  attr_reader :player, :game_type

  def rows
    PlayerSeasonAdvancedStat.where(player: player, game_type: game_type)
                            .includes(:as_of_game, :season, :team)
  end
end
