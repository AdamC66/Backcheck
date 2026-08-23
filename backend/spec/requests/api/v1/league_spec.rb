require "rails_helper"

RSpec.describe "GET /api/v1/leagues/:slug", type: :request do
  let(:league) { create(:league, slug: "nhl", name: "National Hockey League") }

  it "returns the league with its teams, alphabetically" do
    create(:team, league: league, name: "Boston Bruins", abbreviation: "BOS", primary_color: "#FFB81C")
    create(:team, league: league, name: "Anaheim Ducks", abbreviation: "ANA")

    get "/api/v1/leagues/nhl", headers: auth_headers(create(:user, is_super_admin: true))

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["data"]).to include("slug" => "nhl", "name" => "National Hockey League")
    expect(response.parsed_body.dig("data", "teams").map { |team| team["name"] })
      .to eq([ "Anaheim Ducks", "Boston Bruins" ])
    expect(response.parsed_body.dig("data", "teams", 1)).to include("primary_color" => "#FFB81C")
  end

  it "reports a league the user can't see as missing" do
    league

    get "/api/v1/leagues/nhl", headers: auth_headers(create(:user))

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body.dig("error", "code")).to eq("not_found")
  end
end
