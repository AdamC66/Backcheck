FactoryBot.define do
  factory :player_game_zone_time do
    game
    player
    team { game.home_team }

    offensive_seconds { 240 }
    neutral_seconds { 180 }
    defensive_seconds { 210 }
    offensive_starts { 5 }
    neutral_starts { 3 }
    defensive_starts { 4 }
    on_the_fly_starts { 6 }
  end
end
