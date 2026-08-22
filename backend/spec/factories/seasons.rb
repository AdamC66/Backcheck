FactoryBot.define do
  factory :season do
    sequence(:label) { |n| "202#{n}-202#{n + 1}" }
    starts_on { Date.new(2025, 9, 1) }
    ends_on { Date.new(2026, 6, 1) }
  end
end
