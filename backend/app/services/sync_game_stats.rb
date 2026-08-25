class SyncGameStats
  attr_reader :missing_players

  def initialize(game:, client: NhlClient.new)
    @game = game
    @client = client
    @missing_players = []
  end

  def call
    payload = client.boxscore(game.nhl_game_id)
    upsert = UpsertGameStats.new(game: game, payload: payload)
    stats = upsert.call
    missing_players.concat(upsert.missing_players)

    stats.each { |stat| recompute(stat) }
    stats
  end

  private

  attr_reader :game, :client

  def recompute(stat)
    RecomputeSeasonStats.new(player: stat.player, team: stat.team, season: game.season,
                              game_type: game.game_type).call
  end
end
