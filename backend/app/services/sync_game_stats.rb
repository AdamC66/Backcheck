class SyncGameStats
  attr_reader :missing_players

  # recompute: false lets a bulk caller batch RecomputeSeasonStats once per distinct
  # player/team instead of once per game (TASK-88).
  def initialize(game:, client: NhlClient.new, recompute: true)
    @game = game
    @client = client
    @recompute = recompute
    @missing_players = []
  end

  def call
    payload = client.boxscore(game.nhl_game_id)
    upsert = UpsertGameStats.new(game: game, payload: payload, client: client)
    stats = upsert.call
    missing_players.concat(upsert.missing_players)

    stats.each { |stat| recompute_stat(stat) } if recompute
    stats
  end

  private

  attr_reader :game, :client, :recompute

  def recompute_stat(stat)
    RecomputeSeasonStats.new(player: stat.player, team: stat.team, season: game.season,
                              game_type: game.game_type).call
  end
end
