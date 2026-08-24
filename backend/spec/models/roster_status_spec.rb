require "rails_helper"

RSpec.describe RosterStatus, type: :model do
  it "is valid with a status and a started_on in the past or today" do
    expect(build(:roster_status)).to be_valid
  end

  it "rejects a started_on in the future" do
    roster_status = build(:roster_status, started_on: Date.current + 1)

    expect(roster_status).not_to be_valid
    expect(roster_status.errors[:started_on]).to be_present
  end

  it "rejects an ended_on before started_on" do
    roster_status = build(:roster_status, started_on: Date.current, ended_on: Date.current - 1)

    expect(roster_status).not_to be_valid
    expect(roster_status.errors[:ended_on]).to be_present
  end

  it "allows only one open period per player/team/season" do
    open = create(:roster_status)

    duplicate = build(:roster_status, player: open.player, team: open.team, season: open.season)

    expect(duplicate).not_to be_valid
  end
end
