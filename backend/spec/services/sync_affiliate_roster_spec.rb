require "rails_helper"

RSpec.describe SyncAffiliateRoster do
  let(:ahl) { create(:league, slug: "ahl", abbreviation: "AHL", tier: 2) }
  let(:echl) { create(:league, slug: "echl", abbreviation: "ECHL", tier: 3) }
  let!(:marlies) { create(:team, league: ahl, abbreviation: "MRL", name: "Toronto Marlies") }
  let!(:cyclones) { create(:team, league: echl, abbreviation: "CIN", name: "Cincinnati Cyclones", hockeytech_team_id: 5) }

  def sync_ahl
    described_class.new(team: marlies, client: unthrottled_hockeytech_client("ahl")).call
  end

  def sync_echl
    described_class.new(team: cyclones, client: unthrottled_hockeytech_client("echl")).call
  end

  before do
    stub_hockeytech("seasons", fixture: "seasons", client_code: "ahl")
    stub_hockeytech("teamsbyseason", fixture: "teamsbyseason", client_code: "ahl", season_id: 94)
    stub_hockeytech("roster", fixture: "roster_empty", client_code: "ahl", team_id: "335", season_id: 94)
    stub_hockeytech("roster", fixture: "roster", client_code: "ahl", team_id: "335", season_id: 90)
  end

  it "probes past the empty current season, resolves the team id, and syncs the one with a roster" do
    spots = sync_ahl

    expect(marlies.reload.hockeytech_team_id).to eq(335)
    season = Season.find_by(league: ahl, hockeytech_season_id: 90)
    expect(season).to have_attributes(label: "2025-26", starts_on: Date.new(2025, 10, 3))

    thrun = Player.find_by(normalized_name: "henrythrun")
    expect(spots.find { |s| s.player == thrun }).to have_attributes(
      contract_level: RosterSpot::CONTRACT_LEVELS[:nhl], contract_level_inferred: false,
      source: RosterSpot::SOURCES[:hockeytech]
    )
    expect(PlayerExternalId.find_by(source: "hockeytech_ahl", external_id: "9994").player).to eq(thrun)
  end

  it "updates in place on a rerun instead of duplicating" do
    sync_ahl
    sync_ahl

    expect(Player.count).to eq(2)
    expect(RosterSpot.count).to eq(2)
  end

  it "inherits contract level from the matching AHL spot when the ECHL feed reports no status" do
    sync_ahl

    stub_hockeytech("seasons", fixture: "echl_seasons", client_code: "echl")
    stub_hockeytech("roster", fixture: "roster_empty", client_code: "echl", team_id: "5", season_id: 78)
    stub_hockeytech("roster", fixture: "echl_roster", client_code: "echl", team_id: "5", season_id: 73)

    spots = sync_echl

    thrun = Player.find_by(normalized_name: "henrythrun")
    thrun_spot = spots.find { |s| s.player == thrun }
    expect(thrun_spot).to have_attributes(contract_level: RosterSpot::CONTRACT_LEVELS[:nhl], contract_level_inferred: true)

    new_player_spot = spots.find { |s| s.player != thrun }
    expect(new_player_spot).to have_attributes(contract_level: RosterSpot::CONTRACT_LEVELS[:unknown], contract_level_inferred: true)
  end

  it "reports rather than links a same-name entry whose birthdate disagrees with the one on file" do
    sync_ahl # creates Hunter Strand with birthdate 2002-11-13

    stub_hockeytech("seasons", fixture: "echl_seasons", client_code: "echl")
    stub_hockeytech("roster", fixture: "roster_empty", client_code: "echl", team_id: "5", season_id: 78)
    stub_hockeytech("roster", fixture: "echl_roster", client_code: "echl", team_id: "5", season_id: 73)

    sync = described_class.new(team: cyclones, client: unthrottled_hockeytech_client("echl"))
    sync.call

    expect(sync.possible_duplicates.join).to include("Hunter Strand")
    expect(Player.where(normalized_name: "hunterstrand").count).to eq(2)

    duplicate = PossibleDuplicatePlayer.sole
    expect(duplicate.detail).to include("Hunter Strand")
    expect([ duplicate.player_a, duplicate.player_b ].map(&:normalized_name)).to eq(%w[hunterstrand hunterstrand])
  end

  it "doesn't write a second row for the same pair on a rerun" do
    sync_ahl

    stub_hockeytech("seasons", fixture: "echl_seasons", client_code: "echl")
    stub_hockeytech("roster", fixture: "roster_empty", client_code: "echl", team_id: "5", season_id: 78)
    stub_hockeytech("roster", fixture: "echl_roster", client_code: "echl", team_id: "5", season_id: 73)

    sync_echl
    sync_echl

    expect(PossibleDuplicatePlayer.count).to eq(1)
  end

  it "raises rather than guess when nothing recent has a published roster" do
    stub_hockeytech("roster", fixture: "roster_empty", client_code: "ahl", team_id: "335", season_id: 90)

    expect { sync_ahl }.to raise_error(described_class::NoRosterAvailable)
  end
end
