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

  it "follows the 307 current roster redirects to and reads the season it resolved to" do
    stub_request(:get, "https://api-web.nhle.com/v1/roster/TOR/current")
      .to_return(status: 307, headers: { "Location" => "https://api-web.nhle.com/v1/roster/TOR/20262027" })
    stub_nhl("/v1/roster/TOR/20262027", fixture: "roster")

    result = unthrottled_client.roster("TOR")

    expect(result["season_id"]).to eq(20262027)
    expect(result["forwards"].first.dig("lastName", "default")).to eq("Matthews")
  end

  it "gives up rather than loop forever on a redirect cycle" do
    stub_request(:get, "https://api-web.nhle.com/v1/roster/TOR/current")
      .to_return(status: 307, headers: { "Location" => "https://api-web.nhle.com/v1/roster/TOR/current" })

    expect { unthrottled_client.roster("TOR") }.to raise_error(described_class::TooManyRedirects)
  end
end
