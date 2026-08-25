FactoryBot.define do
  factory :skater_season_stat do
    player
    season
    team { association :team, league: season.league }

    game_type { Game::GAME_TYPES[:regular_season] }
    games_played { 82 }
    goals { 20 }
    assists { 30 }
    points { 50 }
  end
end
