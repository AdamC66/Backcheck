require "rails_helper"

RSpec.describe HockeyTechClient do
  it "returns a roster, staff array and all, for a successful request" do
    stub_hockeytech("roster", fixture: "roster", team_id: "335", season_id: 90)

    result = unthrottled_hockeytech_client.roster(team_id: "335", season_id: 90)

    expect(result.select { |entry| entry.is_a?(Hash) }.map { |p| p["last_name"] }).to eq(%w[Thrun Strand])
    expect(result.last).to be_an(Array)
  end

  it "raises rather than fetch every team's roster when team_id is blank" do
    expect { unthrottled_hockeytech_client.roster(team_id: nil, season_id: 90) }.to raise_error(ArgumentError)
  end

  it "gives up after the attempt limit" do
    stub_hockeytech("seasons", body: "", status: 500)

    expect { unthrottled_hockeytech_client.seasons }.to raise_error(described_class::ServerError)
    expect(a_request(:get, "https://lscluster.hockeytech.com/feed/index.php").with(query: hash_including(view: "seasons")))
      .to have_been_made.times(described_class::MAX_ATTEMPTS)
  end

  it "treats a 200 with a non-JSON body as an invalid response, not a crash" do
    stub_hockeytech("roster", body: "Invalid key.", team_id: "335", season_id: 90)

    expect { unthrottled_hockeytech_client.roster(team_id: "335", season_id: 90) }
      .to raise_error(described_class::InvalidResponse)
  end
end
