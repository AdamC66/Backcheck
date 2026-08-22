FactoryBot.define do
  factory :revoked_token do
    sequence(:jti) { |n| "jti-#{n}" }
    expires_at { 24.hours.from_now }
  end
end
