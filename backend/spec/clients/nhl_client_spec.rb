require "rails_helper"

RSpec.describe NhlClient do
  it "returns parsed JSON for a successful request" do
    stub_nhl("/v1/standings/2026-04-16", fixture: "standings")

    result = unthrottled_client.standings_on(Date.new(2026, 4, 16))

    expect(result["standings"].map { |team| team.dig("teamAbbrev", "default") })
      .to contain_exactly("COL", "CGY", "TOR")
  end

  it "gives up after the attempt limit" do
    stub_nhl("/v1/standings-season", body: "", status: 500)

    expect { unthrottled_client.standings_season }.to raise_error(described_class::ServerError)
    expect(a_request(:get, "https://api-web.nhle.com/v1/standings-season"))
      .to have_been_made.times(described_class::MAX_ATTEMPTS)
  end
end
