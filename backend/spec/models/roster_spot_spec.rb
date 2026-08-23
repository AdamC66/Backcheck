require "rails_helper"

RSpec.describe RosterSpot, type: :model do
  it "is valid with a player, a team, and a season from that team's league" do
    expect(build(:roster_spot)).to be_valid
  end

  it "rejects a team from a different league than the season" do
    spot = build(:roster_spot, team: create(:team))

    expect(spot).not_to be_valid
    expect(spot.errors[:team]).to include("must belong to the same league as the season")
  end

  it "lets one player hold a spot on every tier in the same year" do
    player = create(:player)
    spots = [ :nhl, :ahl, :echl ].map do |level|
      season = create(:season)
      build(:roster_spot, player: player, season: season,
            team: create(:team, league: season.league),
            contract_level: described_class::CONTRACT_LEVELS[level])
    end

    expect(spots).to all(be_valid)
  end
end
