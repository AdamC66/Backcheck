FactoryBot.define do
  factory :shift do
    game
    team { game.home_team }
    player

    sequence(:nhl_shift_id) { |n| n }
    period { 1 }
    start_time_seconds { 0 }
    end_time_seconds { 45 }
  end
end
