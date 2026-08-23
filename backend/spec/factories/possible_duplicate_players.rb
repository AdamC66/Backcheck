FactoryBot.define do
  # player_a is built first, so it gets the lower id — the ascending order the model
  # requires — without needing to sort anything after the fact.
  factory :possible_duplicate_player do
    player_a { association :player }
    player_b { association :player }
    detail { "birthdate: 2003-10-10 vs 2003-08-10" }
  end
end
