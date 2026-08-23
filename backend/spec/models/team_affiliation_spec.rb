require "rails_helper"

RSpec.describe TeamAffiliation, type: :model do
  it "is valid with a parent and an affiliate in a lower tier league, in the parent's season" do
    expect(build(:team_affiliation)).to be_valid
  end

  it "rejects an affiliate in the same or a higher tier than the parent" do
    affiliation = build(:team_affiliation, affiliate_team: create(:team, league: create(:league, tier: 1)))

    expect(affiliation).not_to be_valid
    expect(affiliation.errors[:affiliate_team]).to include("must be in a lower tier league than the parent team")
  end

  it "lets one NHL team hold both an AHL and an ECHL affiliate in the same season" do
    parent = create(:team, league: create(:league, tier: 1))
    season = create(:season, league: parent.league)

    ahl = build(:team_affiliation, parent_team: parent, season: season,
                affiliate_team: create(:team, league: create(:league, tier: 2)))
    echl = build(:team_affiliation, parent_team: parent, season: season,
                 affiliate_team: create(:team, league: create(:league, tier: 3)))

    expect([ ahl, echl ]).to all(be_valid)
  end
end
