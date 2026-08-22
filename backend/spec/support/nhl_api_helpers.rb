require "webmock/rspec"

# Every spec runs with real HTTP disabled, so a sync spec can never quietly depend on
# the live NHL API (or hammer it on a loop).
WebMock.disable_net_connect!(allow_localhost: true)

module NhlApiHelpers
  # Fixtures are trimmed recordings of real payloads — see spec/fixtures/files/nhl/.
  def nhl_fixture(name)
    Rails.root.join("spec/fixtures/files/nhl/#{name}.json").read
  end

  def stub_nhl(path, fixture: nil, body: nil, status: 200)
    stub_request(:get, "https://api-web.nhle.com#{path}")
      .to_return(status: status, body: body || nhl_fixture(fixture), headers: { "Content-Type" => "application/json" })
  end

  # The client sleeps between requests; specs shouldn't.
  def unthrottled_client
    NhlClient.new(min_interval: 0)
  end
end

RSpec.configure do |config|
  config.include NhlApiHelpers

  # The throttle's last-request timestamp is process-wide, so it has to be reset or the
  # first request of each spec waits on the previous spec's.
  config.before { NhlClient.last_request_at = nil }
end
