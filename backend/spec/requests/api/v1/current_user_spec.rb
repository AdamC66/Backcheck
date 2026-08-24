require "rails_helper"

RSpec.describe "GET /api/v1/me", type: :request do
  it "returns the authenticated user" do
    user = create(:user, is_super_admin: true)

    get "/api/v1/me", headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["data"]).to eq(
      "id" => user.id, "email" => user.email, "is_super_admin" => true, "memberships" => []
    )
  end

  it "includes the user's memberships with role and scope" do
    user = create(:user)
    team = create(:team, name: "Toronto Maple Leafs")
    role = create(:role, key: "gm", scope_type: "team")
    create(:membership, user: user, role: role, scopeable: team)

    get "/api/v1/me", headers: auth_headers(user)

    expect(response.parsed_body.dig("data", "memberships")).to eq(
      [ { "role" => "gm", "scope_type" => "team", "scopeable_id" => team.id,
         "scopeable_name" => "Toronto Maple Leafs" } ]
    )
  end

  it "rejects a request without a token" do
    get "/api/v1/me"

    expect(response).to have_http_status(:unauthorized)
    expect(response.parsed_body.dig("error", "code")).to eq("unauthorized")
  end
end
