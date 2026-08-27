require "rails_helper"

RSpec.describe Player, type: :model do
  it "is valid with a name and a position" do
    expect(build(:player)).to be_valid
  end

  it "lands two spellings of the same name on one match key" do
    nhl = create(:player, first_name: "David", last_name: "Kampf")
    ahl = build(:player, first_name: "David", last_name: "Kämpf", nhl_player_id: nil)

    expect(ahl.tap(&:valid?).normalized_name).to eq(nhl.normalized_name)
    expect(described_class.normalize_name("T.J.", "Brodie")).to eq("tjbrodie")
  end

  describe "#current_team" do
    it "is the team of the most recent roster_spot, independent of whether they've played" do
      nhl = create(:league)
      earlier = create(:season, league: nhl, starts_on: Date.new(2024, 10, 1), ends_on: Date.new(2025, 6, 1))
      later = create(:season, league: nhl, starts_on: Date.new(2025, 10, 1), ends_on: Date.new(2026, 6, 1))
      old_team = create(:team, league: nhl)
      new_team = create(:team, league: nhl)
      player = create(:player)
      create(:roster_spot, player: player, team: old_team, season: earlier)
      create(:roster_spot, player: player, team: new_team, season: later)

      expect(player.current_team).to eq(new_team)
    end

    it "is nil for a player with no roster_spot on file" do
      expect(create(:player).current_team).to be_nil
    end
  end
end
