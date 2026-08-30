# Re-sums player_game_zone_times from scratch per (player, team, season, game_type)
# stint, same discipline as RecomputeSeasonStats — no chain to walk, since zone time
# has no strength/score splits or game-by-game as-of history. See docs/DECISIONS.md.
class RecomputeSeasonZoneTime
  SUMMABLE_COLUMNS = %i[
    offensive_seconds neutral_seconds defensive_seconds
    offensive_starts neutral_starts defensive_starts on_the_fly_starts
  ].freeze

  def initialize(player:, team:, season:, game_type:)
    @player = player
    @team = team
    @season = season
    @game_type = game_type
  end

  def call
    rows = PlayerGameZoneTime.where(player: player, team: team, game: games).to_a
    scope = PlayerSeasonZoneTime.where(player: player, team: team, season: season, game_type: game_type)
    return scope.destroy_all if rows.empty?

    totals = SUMMABLE_COLUMNS.index_with { |column| rows.sum { |row| row.public_send(column) } }
    scope.first_or_initialize.update!(games_played: rows.size, **totals)
  end

  private

  attr_reader :player, :team, :season, :game_type

  def games
    Game.for_season(season).where(game_type: game_type).for_team(team)
  end
end
