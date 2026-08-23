FactoryBot.define do
  factory :player_external_id do
    player
    source { "hockeytech_ahl" }
    sequence(:external_id) { |n| (9000 + n).to_s }
    matched_by { PlayerExternalId::MATCHED_BY[:birthdate] }
  end
end
