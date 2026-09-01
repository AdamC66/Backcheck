require "rails_helper"

RSpec.describe LineupSlot, type: :model do
  it "is valid for a player on the team's roster for the season" do
    expect(build(:lineup_slot)).to be_valid
  end

  it "rejects a player who isn't on the team's roster" do
    lineup = create(:lineup)
    slot = build(:lineup_slot, lineup: lineup, player: create(:player))

    expect(slot).not_to be_valid
    expect(slot.errors[:player]).to be_present
  end

  it "rejects a player on an open injured-reserve period" do
    slot = build(:lineup_slot)
    create(:roster_status, player: slot.player, team: slot.lineup.team, season: slot.lineup.game.season,
                           status: RosterStatus::STATUSES[:injured_reserve], started_on: Date.current)

    expect(slot).not_to be_valid
    expect(slot.errors[:player].join).to match(/injured reserve/)
  end

  it "rejects a unit_number outside the range for its unit type" do
    slot = build(:lineup_slot, unit_type: :power_play, unit_number: 3)

    expect(slot).not_to be_valid
    expect(slot.errors[:unit_number]).to be_present
  end
end
