FactoryBot.define do
  factory :league do
    name { "Test League" }
    sequence(:slug) { |n| "test-league-#{n}" }
    sequence(:abbreviation) { |n| "TL#{n}" }
    tier { 1 }
  end
end
