FactoryBot.define do
  factory :membership do
    user
    association :role, factory: :role, scope_type: "team"
    association :scopeable, factory: :team
  end
end
