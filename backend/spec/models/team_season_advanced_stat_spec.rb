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

  it "allows the same team and strength state to hold separate rows per score state" do
    existing = create(:team_season_advanced_stat, score_state: PlayerGameAdvancedStat::SCORE_STATES[:all])

    close = build(:team_season_advanced_stat, team: existing.team, season: existing.season,
                  strength_state: existing.strength_state, score_state: PlayerGameAdvancedStat::SCORE_STATES[:close])

    expect(close).to be_valid
  end

  it "rejects a duplicate score_state for the same team, season, and strength state" do
    existing = create(:team_season_advanced_stat)

    dup = build(:team_season_advanced_stat, team: existing.team, season: existing.season,
                strength_state: existing.strength_state, score_state: existing.score_state)

    expect(dup).not_to be_valid
  end

  it "allows the same team to hold separate rows per game_type in one season" do
    existing = create(:team_season_advanced_stat, game_type: Game::GAME_TYPES[:regular_season])

    playoffs = build(:team_season_advanced_stat, team: existing.team, season: existing.season,
                     strength_state: existing.strength_state, score_state: existing.score_state,
                     game_type: Game::GAME_TYPES[:playoffs])

    expect(playoffs).to be_valid
  end

  it "rejects a duplicate game_type for the same team, season, strength state, and score state" do
    existing = create(:team_season_advanced_stat)

    dup = build(:team_season_advanced_stat, team: existing.team, season: existing.season,
                strength_state: existing.strength_state, score_state: existing.score_state,
                game_type: existing.game_type)

    expect(dup).not_to be_valid
  end
end
