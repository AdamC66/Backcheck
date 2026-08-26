FactoryBot.define do
  factory :xg_model do
    sequence(:version) { |n| "v#{n}" }
    coefficients { { intercept: -1.2, distance: -0.03, angle: -0.01 } }
    trained_at { Time.utc(2026, 8, 1) }
    active { false }
  end
end
