FactoryBot.define do
  factory :league do
    name { "Test League" }
    sequence(:slug) { |n| "test-league-#{n}" }
  end
end
