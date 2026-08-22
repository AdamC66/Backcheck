FactoryBot.define do
  factory :season do
    league
    sequence(:label) { |n| "20#{24 + n}-#{25 + n}" }
    starts_on { Date.new(2025, 10, 7) }
    ends_on { Date.new(2026, 4, 16) }
  end
end
