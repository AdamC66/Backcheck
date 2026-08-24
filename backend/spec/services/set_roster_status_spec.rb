require "rails_helper"

RSpec.describe SetRosterStatus do
  let(:season) { create(:season) }
  let(:team) { create(:team, league: season.league) }
  let(:player) { create(:player) }

  def set_status(status:, effective_on: Date.current)
    described_class.new(player: player, team: team, season: season, status: status, effective_on: effective_on).call
  end

  it "opens a new period when placing a player on injured reserve" do
    result = set_status(status: "injured_reserve", effective_on: Date.current - 3)

    expect(result.success?).to be true
    expect(result.result).to have_attributes(status: RosterStatus::STATUSES[:injured_reserve],
                                              started_on: Date.current - 3, ended_on: nil)
  end

  it "closes the open period without opening a new one when returning to active" do
    open_period = create(:roster_status, player: player, team: team, season: season, started_on: Date.current - 5)

    result = set_status(status: "active")

    expect(result.success?).to be true
    expect(result.result).to be_nil
    expect(open_period.reload.ended_on).to eq(Date.current)
  end

  it "closes the prior period when transitioning straight from one status to another" do
    ir_period = create(:roster_status, player: player, team: team, season: season,
                                       status: RosterStatus::STATUSES[:injured_reserve], started_on: Date.current - 5)

    result = set_status(status: "non_roster")

    expect(result.success?).to be true
    expect(ir_period.reload.ended_on).to eq(Date.current)
    expect(result.result.status).to eq(RosterStatus::STATUSES[:non_roster])
  end

  it "destroys the period instead of closing it when it opened and closed the same day" do
    set_status(status: "injured_reserve")

    result = set_status(status: "active")

    expect(result.success?).to be true
    expect(RosterStatus.where(player: player, team: team, season: season)).to be_empty
  end

  it "destroys a same-day period when switching straight to another status" do
    set_status(status: "injured_reserve")

    result = set_status(status: "non_roster")

    expect(result.success?).to be true
    expect(RosterStatus.where(player: player, team: team, season: season).count).to eq(1)
    expect(result.result.status).to eq(RosterStatus::STATUSES[:non_roster])
  end

  it "fails without touching the open period when the new period is invalid" do
    open_period = create(:roster_status, player: player, team: team, season: season, started_on: Date.current - 5)

    result = set_status(status: "non_roster", effective_on: Date.current + 1)

    expect(result.success?).to be false
    expect(open_period.reload.ended_on).to be_nil
  end
end
