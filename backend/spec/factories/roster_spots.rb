FactoryBot.define do
  factory :roster_spot do
    player
    season
    team { association :team, league: season.league }

    contract_level { RosterSpot::CONTRACT_LEVELS[:nhl] }
    source { RosterSpot::SOURCES[:nhl_api] }
    jersey_number { 34 }
  end
end
