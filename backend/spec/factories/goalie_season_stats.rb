FactoryBot.define do
  factory :goalie_season_stat do
    player
    season
    team { association :team, league: season.league }

    game_type { Game::GAME_TYPES[:regular_season] }
    games_played { 60 }
    games_started { 58 }
    wins { 35 }
    losses { 18 }
    ot_losses { 5 }
    shots_against { 1700 }
    saves { 1580 }
    goals_against { 120 }
  end
end
