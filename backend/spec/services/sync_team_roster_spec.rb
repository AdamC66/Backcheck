require "rails_helper"

RSpec.describe SyncTeamRoster do
  let(:league) { create(:league, slug: "nhl", abbreviation: "NHL") }
  let!(:season) { create(:season, league: league, nhl_season_id: 20262027) }
  let!(:leafs) { create(:team, league: league, abbreviation: "TOR", name: "Toronto Maple Leafs") }

  before do
    stub_request(:get, "https://api-web.nhle.com/v1/roster/TOR/current")
      .to_return(status: 307, headers: { "Location" => "https://api-web.nhle.com/v1/roster/TOR/20262027" })
    stub_nhl("/v1/roster/TOR/20262027", fixture: "roster")
  end

  def sync
    described_class.new(team: leafs, client: unthrottled_client).call
  end

  it "creates a player and an nhl-level roster spot per roster entry" do
    spots = sync

    expect(spots).to all(be_persisted)
    matthews = Player.find_by(nhl_player_id: 8479318)
    expect(matthews).to have_attributes(last_name: "Matthews", position: Player::POSITIONS[:center])
    expect(matthews.roster_spots.sole).to have_attributes(
      team: leafs, season: season,
      contract_level: RosterSpot::CONTRACT_LEVELS[:nhl], contract_level_inferred: false
    )
  end

  it "raises rather than guess at a season the backfill hasn't created yet" do
    Season.destroy_all

    expect { sync }.to raise_error(described_class::UnknownSeason)
  end

  it "updates in place on a rerun instead of duplicating" do
    sync
    sync

    expect(Player.count).to eq(3)
    expect(RosterSpot.count).to eq(3)
  end
end
