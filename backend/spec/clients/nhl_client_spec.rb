require "rails_helper"

RSpec.describe NhlClient do
  it "returns parsed JSON for a successful request" do
    stub_nhl("/v1/standings/2026-04-16", fixture: "standings")

    result = unthrottled_client.standings_on(Date.new(2026, 4, 16))

    expect(result["standings"].map { |team| team.dig("teamAbbrev", "default") })
      .to contain_exactly("COL", "CGY", "TOR")
  end

  it "retries a server error and succeeds on a later attempt" do
    stub_request(:get, "https://api-web.nhle.com/v1/standings-season")
      .to_return({ status: 503, body: "" }, { status: 200, body: nhl_fixture("standings_season") })

    expect(unthrottled_client.standings_season["seasons"].size).to eq(3)
  end

  it "gives up after the attempt limit" do
    stub_nhl("/v1/standings-season", body: "", status: 500)

    expect { unthrottled_client.standings_season }.to raise_error(described_class::ServerError)
    expect(a_request(:get, "https://api-web.nhle.com/v1/standings-season"))
      .to have_been_made.times(described_class::MAX_ATTEMPTS)
  end

  it "raises NotFound without retrying, since a missing season won't appear on a retry" do
    stub_nhl("/v1/club-schedule-season/TOR/19171918", body: "", status: 404)

    expect { unthrottled_client.club_schedule_season("TOR", 19171918) }
      .to raise_error(described_class::NotFound)
    expect(a_request(:get, "https://api-web.nhle.com/v1/club-schedule-season/TOR/19171918"))
      .to have_been_made.once
  end

  it "waits out the minimum interval between requests" do
    stub_nhl("/v1/standings-season", fixture: "standings_season")
    client = described_class.new(min_interval: 0.2)

    client.standings_season
    started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    client.standings_season

    expect(Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at).to be >= 0.2
  end
end
