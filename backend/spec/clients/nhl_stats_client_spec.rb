require "rails_helper"

RSpec.describe NhlStatsClient do
  it "returns shift-chart rows for a game" do
    stub_nhl_stats("/stats/rest/en/shiftcharts", fixture: "shift_chart",
                   query: { "cayenneExp" => "gameId=2024020204" })

    result = unthrottled_stats_client.shift_chart(2024020204)

    expect(result).to be_an(Array)
    expect(result.map { |row| row["typeCode"] }).to include(517)
  end

  it "gives up after the attempt limit" do
    stub_nhl_stats("/stats/rest/en/shiftcharts", body: "", status: 500,
                   query: { "cayenneExp" => "gameId=2024020204" })

    expect { unthrottled_stats_client.shift_chart(2024020204) }.to raise_error(described_class::ServerError)
    expect(a_request(:get, "https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId=2024020204"))
      .to have_been_made.times(described_class::MAX_ATTEMPTS)
  end
end
