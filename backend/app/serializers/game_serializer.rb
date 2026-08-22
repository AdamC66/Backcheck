class GameSerializer
  GAME_TYPE_NAMES = Game::GAME_TYPES.invert.freeze

  def initialize(game)
    @game = game
  end

  def as_json(*)
    {
      id: game.id,
      nhl_game_id: game.nhl_game_id,
      game_type: GAME_TYPE_NAMES[game.game_type]&.to_s,
      game_date: game.game_date,
      starts_at: game.starts_at,
      venue: game.venue,
      neutral_site: game.neutral_site,
      state: game.state,
      last_period_type: game.last_period_type,
      home: side(game.home_team, game.home_score),
      away: side(game.away_team, game.away_score)
    }
  end

  private

  attr_reader :game

  def side(team, score)
    { team: TeamSerializer.new(team).as_json, score: score }
  end
end
