require "rails_helper"

RSpec.describe "GET /api/v1/me", type: :request do
  it "returns the authenticated user" do
    user = create(:user, is_super_admin: true)

    get "/api/v1/me", headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["data"]).to eq(
      "id" => user.id, "email" => user.email, "is_super_admin" => true
    )
  end

  it "rejects a request without a token" do
    get "/api/v1/me"

    expect(response).to have_http_status(:unauthorized)
    expect(response.parsed_body.dig("error", "code")).to eq("unauthorized")
  end
end
