require "rails_helper"

RSpec.describe SetRosterAssignment do
  let(:season) { create(:season) }
  let(:team) { create(:team, league: season.league) }
  let(:player) { create(:player) }

  def set_assignment(contract_level:)
    described_class.new(player: player, team: team, season: season, contract_level: contract_level).call
  end

  it "creates a roster_spot when the player has no spot on this team/season yet" do
    result = set_assignment(contract_level: :ahl)

    expect(result.success?).to be true
    expect(result.result).to have_attributes(
      contract_level: RosterSpot::CONTRACT_LEVELS[:ahl], contract_level_inferred: false,
      source: RosterSpot::SOURCES[:manual]
    )
  end

  it "updates the contract_level of an existing spot in place rather than creating a second row" do
    spot = create(:roster_spot, player: player, team: team, season: season,
                               contract_level: RosterSpot::CONTRACT_LEVELS[:ahl])

    result = set_assignment(contract_level: :nhl)

    expect(result.success?).to be true
    expect(RosterSpot.where(player: player, team: team, season: season).count).to eq(1)
    expect(spot.reload.contract_level).to eq(RosterSpot::CONTRACT_LEVELS[:nhl])
  end
end
