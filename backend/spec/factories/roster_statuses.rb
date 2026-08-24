FactoryBot.define do
  factory :roster_status do
    player
    season
    team { association :team, league: season.league }

    status { RosterStatus::STATUSES[:injured_reserve] }
    started_on { Date.current }
  end
end
