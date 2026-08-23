module HockeyTechApiHelpers
  def hockeytech_fixture(name)
    Rails.root.join("spec/fixtures/files/hockeytech/#{name}.json").read
  end

  def stub_hockeytech(view, fixture: nil, body: nil, status: 200, client_code: "ahl", **query)
    params = { feed: "modulekit", view: view, key: HockeyTechClient::KEYS.fetch(client_code),
               client_code: client_code, fmt: "json" }.merge(query)

    stub_request(:get, "https://lscluster.hockeytech.com/feed/index.php")
      .with(query: params)
      .to_return(status: status, body: body || hockeytech_fixture(fixture), headers: { "Content-Type" => "application/json" })
  end

  # The client sleeps between requests; specs shouldn't.
  def unthrottled_hockeytech_client(client_code = "ahl")
    HockeyTechClient.new(client_code, min_interval: 0)
  end
end

RSpec.configure do |config|
  config.include HockeyTechApiHelpers

  # Process-wide, so without a reset each spec waits on the previous spec's request.
  config.before { HockeyTechClient.last_request_at = nil }
end
