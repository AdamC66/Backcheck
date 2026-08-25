require "rails_helper"

RSpec.describe Team, type: :model do
  it "is valid with a name, abbreviation, and a league" do
    expect(build(:team)).to be_valid
  end

  it "rejects a color that isn't a hex triplet" do
    expect(build(:team, primary_color: "red")).not_to be_valid
  end

  describe "#current_roster_season" do
    it "picks the season with roster data, not just the newest season row" do
      league = create(:league)
      team = create(:team, league: league)
      populated = create(:season, league: league, starts_on: 1.year.ago, ends_on: 1.year.ago + 6.months)
      create(:season, league: league, starts_on: 1.month.from_now, ends_on: 7.months.from_now)
      create(:roster_spot, team: team, season: populated)

      expect(team.current_roster_season).to eq(populated)
    end

    it "is nil for a team with no roster data on file" do
      expect(create(:team).current_roster_season).to be_nil
    end
  end

  describe "#current_stats_season" do
    it "picks the season with stats data, not just the newest season row" do
      league = create(:league)
      team = create(:team, league: league)
      populated = create(:season, league: league, starts_on: 1.year.ago, ends_on: 1.year.ago + 6.months)
      create(:season, league: league, starts_on: 1.month.from_now, ends_on: 7.months.from_now)
      create(:goalie_season_stat, team: team, season: populated)

      expect(team.current_stats_season).to eq(populated)
    end

    it "is nil for a team with no stats on file" do
      expect(create(:team).current_stats_season).to be_nil
    end
  end
end
