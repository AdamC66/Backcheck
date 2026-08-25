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

  describe ".current_for" do
    it "resolves the season with a real affiliation row, not the league's newest season row" do
      league = create(:league, tier: 1)
      parent = create(:team, league: league)
      old_season = create(:season, league: league, starts_on: 1.year.ago, ends_on: 1.year.ago + 6.months)
      create(:season, league: league, starts_on: 1.month.from_now, ends_on: 7.months.from_now)
      affiliation = create(:team_affiliation, parent_team: parent, season: old_season)

      expect(TeamAffiliation.current_for(parent)).to contain_exactly(affiliation)
    end

    it "returns none for a team with no affiliation on record" do
      parent = create(:team)

      expect(TeamAffiliation.current_for(parent)).to be_empty
    end
  end
end
