require "rails_helper"

RSpec.describe "GET /api/v1/leagues/:league_slug/seasons", type: :request do
  it "lists a league's seasons newest first" do
    league = create(:league, slug: "nhl")
    create(:season, league: league, label: "2024-25", starts_on: Date.new(2024, 10, 1), ends_on: Date.new(2025, 4, 1))
    create(:season, league: league, label: "2025-26", starts_on: Date.new(2025, 10, 1), ends_on: Date.new(2026, 4, 1))

    get "/api/v1/leagues/nhl/seasons", headers: auth_headers(create(:user))

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["data"].map { |season| season["label"] }).to eq(%w[2025-26 2024-25])
  end

  it "404s for an unknown league" do
    get "/api/v1/leagues/does-not-exist/seasons", headers: auth_headers(create(:user))

    expect(response).to have_http_status(:not_found)
  end
end
