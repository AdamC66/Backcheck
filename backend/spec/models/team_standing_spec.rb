require "rails_helper"

RSpec.describe TeamStanding, type: :model do
  it "is valid with a team, season, and date" do
    expect(build(:team_standing)).to be_valid
  end

  it "allows one snapshot per team per date" do
    existing = create(:team_standing)

    duplicate = build(:team_standing, team: existing.team, season: existing.season,
                                      as_of_date: existing.as_of_date)

    expect(duplicate).not_to be_valid
  end

  it "returns only the most recent snapshot per season" do
    season = create(:season)
    team = create(:team, league: season.league)
    create(:team_standing, team: team, season: season, as_of_date: Date.new(2026, 1, 1))
    latest = create(:team_standing, team: team, season: season, as_of_date: Date.new(2026, 2, 1))

    expect(described_class.latest_for_season(season)).to eq([ latest ])
  end
end
