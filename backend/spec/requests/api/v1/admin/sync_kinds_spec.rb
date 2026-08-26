require "rails_helper"

RSpec.describe "GET /api/v1/admin/sync_kinds", type: :request do
  it "serves every kind with its required scope axes" do
    get "/api/v1/admin/sync_kinds", headers: auth_headers(create(:user, is_super_admin: true))

    expect(response).to have_http_status(:ok)
    kinds = response.parsed_body["data"].index_by { |entry| entry["kind"] }
    expect(kinds["team_roster"]["scope"]).to eq([ "team" ])
    expect(kinds["standings"]["scope"]).to eq([ "league", "date" ])
    expect(kinds["advanced_stats"]["scope"]).to eq([ "team", "season" ])
    expect(kinds.keys).to match_array(SyncRun::SYNC_KINDS.keys.map(&:to_s))
  end

  it "rejects a non-super-admin" do
    get "/api/v1/admin/sync_kinds", headers: auth_headers(create(:user))

    expect(response).to have_http_status(:forbidden)
  end
end
