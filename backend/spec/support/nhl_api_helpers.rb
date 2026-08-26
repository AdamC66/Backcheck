require "webmock/rspec"

# No spec may reach the live NHL API.
WebMock.disable_net_connect!(allow_localhost: true)

module NhlApiHelpers
  def nhl_fixture(name)
    Rails.root.join("spec/fixtures/files/nhl/#{name}.json").read
  end

  def stub_nhl(path, fixture: nil, body: nil, status: 200)
    stub_request(:get, "https://api-web.nhle.com#{path}")
      .to_return(status: status, body: body || nhl_fixture(fixture), headers: { "Content-Type" => "application/json" })
  end

  def stub_nhl_stats(path, fixture: nil, body: nil, status: 200, query: nil)
    stub = stub_request(:get, "https://api.nhle.com#{path}")
    stub = stub.with(query: query) if query
    stub.to_return(status: status, body: body || nhl_fixture(fixture), headers: { "Content-Type" => "application/json" })
  end

  # The client sleeps between requests; specs shouldn't.
  def unthrottled_client
    NhlClient.new(min_interval: 0)
  end

  def unthrottled_stats_client
    NhlStatsClient.new(min_interval: 0)
  end
end

RSpec.configure do |config|
  config.include NhlApiHelpers

  # Process-wide, so without a reset each spec waits on the previous spec's request.
  config.before do
    NhlClient.last_request_at = nil
    NhlStatsClient.last_request_at = nil
  end
end
