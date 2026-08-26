require "rails_helper"

RSpec.describe TeamGameAdvancedStat, type: :model do
  it "is valid with a game and a team that played in it" do
    expect(build(:team_game_advanced_stat)).to be_valid
  end

  it "rejects a team that didn't play in the game" do
    stat = build(:team_game_advanced_stat, team: create(:team))

    expect(stat).not_to be_valid
    expect(stat.errors[:team]).to include("must be one of the game's two teams")
  end

  it "allows the same team to hold separate rows per strength state in one game" do
    existing = create(:team_game_advanced_stat, strength_state: PlayerGameAdvancedStat::STRENGTH_STATES[:all])

    five_v_five = build(:team_game_advanced_stat, game: existing.game, team: existing.team,
                        strength_state: PlayerGameAdvancedStat::STRENGTH_STATES[:five_v_five])

    expect(five_v_five).to be_valid
  end

  it "rejects a duplicate strength_state for the same team and game" do
    existing = create(:team_game_advanced_stat)

    dup = build(:team_game_advanced_stat, game: existing.game, team: existing.team,
                strength_state: existing.strength_state)

    expect(dup).not_to be_valid
  end

  it "allows the same team and strength state to hold separate rows per score state" do
    existing = create(:team_game_advanced_stat, score_state: PlayerGameAdvancedStat::SCORE_STATES[:all])

    close = build(:team_game_advanced_stat, game: existing.game, team: existing.team,
                  strength_state: existing.strength_state, score_state: PlayerGameAdvancedStat::SCORE_STATES[:close])

    expect(close).to be_valid
  end

  it "rejects a duplicate score_state for the same team, game, and strength state" do
    existing = create(:team_game_advanced_stat)

    dup = build(:team_game_advanced_stat, game: existing.game, team: existing.team,
                strength_state: existing.strength_state, score_state: existing.score_state)

    expect(dup).not_to be_valid
  end
end
