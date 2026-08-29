require "rails_helper"

RSpec.describe "Api::V1::LeagueSkaters", type: :request do
  let(:user) { create(:user) }
  let(:league) { create(:league, slug: "nhl") }
  let(:season) { create(:season, league: league, label: "2023-24") }
  let(:team) { create(:team, league: league) }

  def get_skaters(query = {})
    get "/api/v1/league_skaters", params: { league: "nhl", season: "2023-24" }.merge(query),
        headers: auth_headers(user)
  end

  describe "GET /api/v1/league_skaters" do
    before do
      create(:skater_season_stat, player: create(:player, last_name: "Alpha"), season: season, team: team, points: 90)
      create(:skater_season_stat, player: create(:player, last_name: "Beta"), season: season, team: team, points: 10)
    end

    it "returns rows and pagination meta for a logged-in user" do
      get_skaters(sort: "points", dir: "desc", per_page: 1)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["data"].size).to eq(1)
      expect(body["data"].first["player"]["last_name"]).to eq("Alpha")
      expect(body["meta"]).to include("total_count" => 2, "total_pages" => 2, "page" => 1)
    end

    it "paginates" do
      get_skaters(sort: "points", dir: "desc", per_page: 1, page: 2)

      expect(response.parsed_body["data"].first["player"]["last_name"]).to eq("Beta")
    end

    it "422s on an unknown sort column" do
      get_skaters(sort: "bogus")

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body.dig("error", "code")).to eq("invalid_parameter")
    end

    it "404s on an unknown league" do
      get "/api/v1/league_skaters", params: { league: "nope" }, headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /api/v1/league_skaters/schema" do
    it "serves columns, filters with options, and the default sort" do
      team
      season
      get "/api/v1/league_skaters/schema", params: { league: "nhl" }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      schema = response.parsed_body["data"]
      expect(schema["columns"].map { |column| column["key"] }).to include("points", "corsi_for")
      expect(schema["filters"].map { |filter| filter["key"] }).to include("team_id", "position", "strength_state")
      expect(schema.dig("sort", "default", "key")).to eq("points")
    end
  end
end
