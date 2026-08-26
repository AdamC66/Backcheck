require "rails_helper"

RSpec.describe TeamSeasonAdvancedStat, type: :model do
  it "is valid with a team and a same-league season" do
    expect(build(:team_season_advanced_stat)).to be_valid
  end

  it "rejects a team from a different league than the season" do
    stat = build(:team_season_advanced_stat, team: create(:team))

    expect(stat).not_to be_valid
    expect(stat.errors[:team]).to include("must belong to the same league as the season")
  end

  it "allows the same team to hold separate rows per strength state in one season" do
    existing = create(:team_season_advanced_stat, strength_state: PlayerGameAdvancedStat::STRENGTH_STATES[:all])

    five_v_five = build(:team_season_advanced_stat, team: existing.team, season: existing.season,
                        strength_state: PlayerGameAdvancedStat::STRENGTH_STATES[:five_v_five])

    expect(five_v_five).to be_valid
  end

  it "rejects a duplicate strength_state for the same team and season" do
    existing = create(:team_season_advanced_stat)

    dup = build(:team_season_advanced_stat, team: existing.team, season: existing.season,
                strength_state: existing.strength_state)

    expect(dup).not_to be_valid
  end
end
