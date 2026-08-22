FactoryBot.define do
  factory :team_standing do
    season
    team { association :team, league: season.league }

    as_of_date { Date.new(2026, 4, 16) }
    games_played { 82 }
    wins { 50 }
    losses { 25 }
    ot_losses { 7 }
    points { 107 }
    goals_for { 280 }
    goals_against { 230 }
    goal_differential { 50 }
  end
end
