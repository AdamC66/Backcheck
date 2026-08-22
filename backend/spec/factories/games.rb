FactoryBot.define do
  factory :game do
    season
    home_team { association :team, league: season.league }
    away_team { association :team, league: season.league }

    sequence(:nhl_game_id) { |n| 2025020000 + n }
    game_type { Game::GAME_TYPES[:regular_season] }
    starts_at { Time.utc(2025, 10, 8, 23, 0) }
    game_date { Date.new(2025, 10, 8) }
    venue { "Test Arena" }
    state { "FINAL" }
  end
end
