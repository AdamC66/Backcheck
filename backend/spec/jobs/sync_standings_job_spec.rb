require "rails_helper"

RSpec.describe SyncStandingsJob do
  it "syncs standings for the NHL through the ingest queue" do
    league = create(:league, slug: "nhl", abbreviation: "NHL")
    create(:season, league: league, nhl_season_id: 20252026)
    create(:team, league: league, abbreviation: "COL")
    stub_nhl("/v1/standings/2026-04-17", fixture: "standings")

    described_class.perform_now(Date.new(2026, 4, 17))

    expect(TeamStanding.count).to eq(1)
    expect(described_class.new.queue_name).to eq("ingest")
  end
end
