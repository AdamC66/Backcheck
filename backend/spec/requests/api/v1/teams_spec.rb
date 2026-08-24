require "rails_helper"

RSpec.describe "GET /api/v1/teams/:id", type: :request do
  let(:league) { create(:league, slug: "nhl", abbreviation: "NHL", name: "National Hockey League") }
  let(:team) { create(:team, league: league, abbreviation: "TOR", name: "Toronto Maple Leafs") }

  it "returns the team with the league it belongs to" do
    get "/api/v1/teams/#{team.id}", headers: auth_headers(create(:user, is_super_admin: true))

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["data"]).to include("abbreviation" => "TOR")
    expect(response.parsed_body.dig("data", "league")).to include(
      "slug" => "nhl", "name" => "National Hockey League"
    )
  end

  it "is visible to any logged-in user, not just one with a membership on it" do
    get "/api/v1/teams/#{team.id}", headers: auth_headers(create(:user))

    expect(response).to have_http_status(:ok)
  end
end
