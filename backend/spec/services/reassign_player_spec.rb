require "rails_helper"

RSpec.describe ReassignPlayer do
  let(:parent_league) { create(:league, tier: 1) }
  let(:affiliate_league) { create(:league, tier: 2) }
  let(:parent_season) { create(:season, league: parent_league) }
  let(:affiliate_season) { create(:season, league: affiliate_league) }
  let(:parent_team) { create(:team, league: parent_league) }
  let(:affiliate_team) { create(:team, league: affiliate_league) }
  let(:player) { create(:player) }

  def reassign(roster_spot, destination_team, destination_season)
    described_class.new(roster_spot: roster_spot, destination_team: destination_team,
                         destination_season: destination_season).call
  end

  it "moves the roster spot to the destination team and season" do
    roster_spot = create(:roster_spot, player: player, team: parent_team, season: parent_season,
                                        contract_level: RosterSpot::CONTRACT_LEVELS[:nhl])

    result = reassign(roster_spot, affiliate_team, affiliate_season)

    expect(result.success?).to be true
    expect(roster_spot.reload).to have_attributes(
      team_id: affiliate_team.id, season_id: affiliate_season.id, source: RosterSpot::SOURCES[:manual],
      contract_level: RosterSpot::CONTRACT_LEVELS[:unknown], contract_level_inferred: true
    )
  end

  it "fails without moving the row when the destination team/season already has a spot for this player" do
    roster_spot = create(:roster_spot, player: player, team: parent_team, season: parent_season)
    create(:roster_spot, player: player, team: affiliate_team, season: affiliate_season)

    result = reassign(roster_spot, affiliate_team, affiliate_season)

    expect(result.success?).to be false
    expect(roster_spot.reload.team_id).to eq(parent_team.id)
  end
end
