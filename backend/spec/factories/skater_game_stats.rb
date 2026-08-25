FactoryBot.define do
  factory :skater_game_stat do
    player
    game
    team { game.home_team }

    goals { 1 }
    assists { 1 }
    points { 2 }
    shots_on_goal { 3 }
    time_on_ice_seconds { 1236 }
  end
end
