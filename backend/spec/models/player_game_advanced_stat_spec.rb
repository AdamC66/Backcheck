require "rails_helper"

RSpec.describe PlayerGameAdvancedStat, type: :model do
  it "is valid with a game, a team that played in it, a player, and an xg_model" do
    expect(build(:player_game_advanced_stat)).to be_valid
  end

  it "rejects a team that didn't play in the game" do
    stat = build(:player_game_advanced_stat, team: create(:team))

    expect(stat).not_to be_valid
    expect(stat.errors[:team]).to include("must be one of the game's two teams")
  end

  it "allows the same player to hold separate rows per strength state in one game" do
    existing = create(:player_game_advanced_stat, strength_state: PlayerGameAdvancedStat::STRENGTH_STATES[:all])

    five_v_five = build(:player_game_advanced_stat, game: existing.game, player: existing.player,
                        team: existing.team, strength_state: PlayerGameAdvancedStat::STRENGTH_STATES[:five_v_five])

    expect(five_v_five).to be_valid
  end

  it "rejects a duplicate strength_state for the same player and game" do
    existing = create(:player_game_advanced_stat)

    dup = build(:player_game_advanced_stat, game: existing.game, player: existing.player,
                team: existing.team, strength_state: existing.strength_state)

    expect(dup).not_to be_valid
  end

  it "allows the same player and strength state to hold separate rows per score state" do
    existing = create(:player_game_advanced_stat, score_state: PlayerGameAdvancedStat::SCORE_STATES[:all])

    close = build(:player_game_advanced_stat, game: existing.game, player: existing.player,
                  team: existing.team, strength_state: existing.strength_state,
                  score_state: PlayerGameAdvancedStat::SCORE_STATES[:close])

    expect(close).to be_valid
  end

  it "rejects a duplicate score_state for the same player, game, and strength state" do
    existing = create(:player_game_advanced_stat)

    dup = build(:player_game_advanced_stat, game: existing.game, player: existing.player,
                team: existing.team, strength_state: existing.strength_state, score_state: existing.score_state)

    expect(dup).not_to be_valid
  end
end
