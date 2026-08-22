require "rails_helper"

RSpec.describe SyncSeasons do
  let(:league) { create(:league, slug: "nhl", abbreviation: "NHL") }

  before { stub_nhl("/v1/standings-season", fixture: "standings_season") }

  def sync(nhl_season_ids: nil)
    described_class.new(league: league, nhl_season_ids: nhl_season_ids, client: unthrottled_client).call
  end

  it "creates a season per upstream entry, labelled for humans" do
    sync

    expect(league.seasons.pluck(:nhl_season_id)).to contain_exactly(20242025, 20252026, 20262027)
    expect(league.seasons.find_by(nhl_season_id: 20252026)).to have_attributes(
      label: "2025-26", starts_on: Date.new(2025, 10, 7), ends_on: Date.new(2026, 4, 17)
    )
  end

  it "imports only the requested seasons" do
    sync(nhl_season_ids: [ 20252026 ])

    expect(league.seasons.pluck(:nhl_season_id)).to eq([ 20252026 ])
  end

  it "updates rather than duplicates on a rerun" do
    sync
    sync

    expect(league.seasons.count).to eq(3)
  end
end
