require "rails_helper"

RSpec.describe "GET /api/v1/admin/roadmap", type: :request do
  it "serves the epics and tasks boards to a super admin" do
    get "/api/v1/admin/roadmap", headers: auth_headers(create(:user, is_super_admin: true))

    expect(response).to have_http_status(:ok)
    body = response.parsed_body["data"]
    expect(body["epics"]).to be_an(Array)
    expect(body["tasks"]).to be_an(Array)
    expect(body["epics"].first).to include("id", "title", "status")
    expect(body["tasks"].first).to include("id", "epic_id", "title", "status")
  end

  it "rejects a non-super-admin" do
    get "/api/v1/admin/roadmap", headers: auth_headers(create(:user))

    expect(response).to have_http_status(:forbidden)
  end
end
