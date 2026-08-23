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

  it "hides a team the caller has no membership for" do
    get "/api/v1/teams/#{team.id}", headers: auth_headers(create(:user))

    expect(response).to have_http_status(:not_found)
  end

  it "leaves the league out of teams embedded in a league payload" do
    team

    get "/api/v1/leagues/nhl", headers: auth_headers(create(:user, is_super_admin: true))

    expect(response.parsed_body.dig("data", "teams", 0)).not_to have_key("league")
  end
end
