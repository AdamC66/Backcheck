# player_season_advanced_stats is a chain of running-total snapshots (TASK-61), not
# season totals on their own — the "season stats" a page wants is each player's most
# recent snapshot per (strength_state, score_state), not every game-boundary row.
class LatestPlayerSeasonAdvancedStats
  def initialize(team:, season:, game_type:)
    @team = team
    @season = season
    @game_type = game_type
  end

  def call
    rows.group_by { |row| [ row.player_id, row.strength_state, row.score_state ] }
        .values
        .map { |group| group.max_by { |row| row.as_of_game.starts_at } }
  end

  private

  attr_reader :team, :season, :game_type

  def rows
    PlayerSeasonAdvancedStat.where(team: team, season: season, game_type: game_type)
                            .includes(:as_of_game, :player)
  end
end
