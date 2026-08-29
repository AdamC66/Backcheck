require "rails_helper"

RSpec.describe "Api::V1::Admin::Coverage", type: :request do
  let(:super_admin) { create(:user, is_super_admin: true) }
  let(:league) { create(:league) }
  let(:season) { create(:season, league: league, nhl_season_id: 20232024) }

  describe "GET /api/v1/admin/coverage" do
    it "returns a coverage row per season for a super admin" do
      season
      get "/api/v1/admin/coverage", params: { league_id: league.id }, headers: auth_headers(super_admin)

      expect(response).to have_http_status(:ok)
      row = response.parsed_body["data"].first
      expect(row).to include("season_id", "season_label", "games", "roster", "stats", "advanced")
    end

    it "rejects a non-super-admin" do
      get "/api/v1/admin/coverage", params: { league_id: league.id }, headers: auth_headers(create(:user))

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/admin/coverage/:season_id/:kind" do
    it "returns the per-game breakdown for a known kind" do
      get "/api/v1/admin/coverage/#{season.id}/stats", headers: auth_headers(super_admin)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("meta", "kind")).to eq("stats")
    end

    it "422s on an unknown kind" do
      get "/api/v1/admin/coverage/#{season.id}/bogus", headers: auth_headers(super_admin)

      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
