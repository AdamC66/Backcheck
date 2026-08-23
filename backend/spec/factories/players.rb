FactoryBot.define do
  factory :player do
    sequence(:nhl_player_id) { |n| 8470000 + n }
    first_name { "Test" }
    sequence(:last_name) { |n| "Player#{n}" }
    position { Player::POSITIONS[:center] }
    birth_date { Date.new(1997, 9, 17) }
    shoots_catches { "L" }
  end
end
