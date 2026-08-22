FactoryBot.define do
  factory :role do
    sequence(:key) { |n| "role_#{n}" }
    label { "Some Role" }
    scope_type { "team" }
  end
end
