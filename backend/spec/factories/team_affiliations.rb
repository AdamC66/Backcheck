FactoryBot.define do
  factory :team_affiliation do
    parent_team { association :team, league: association(:league, tier: 1) }
    season { association :season, league: parent_team.league }
    affiliate_team { association :team, league: association(:league, tier: 2) }
  end
end
