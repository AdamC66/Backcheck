FactoryBot.define do
  factory :goalie_game_stat do
    player
    game
    team { game.home_team }

    shots_against { 30 }
    saves { 28 }
    goals_against { 2 }
    time_on_ice_seconds { 3600 }
    starter { true }
    decision { GoalieGameStat::DECISIONS[:win] }
  end
end
