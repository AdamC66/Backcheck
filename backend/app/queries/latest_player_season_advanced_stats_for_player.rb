# Same "chain of running-total snapshots" rationale as LatestPlayerSeasonAdvancedStats
# (TASK-61): the latest as_of_game per bucket is the season total, not every chained row.
# Scoped to one player across every season/team they've played for, rather than one
# team+season across every player.
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
