FactoryBot.define do
  factory :team do
    name { "Test Team" }
    sequence(:abbreviation) { |n| "TT#{n}" }
    league
  end
end
