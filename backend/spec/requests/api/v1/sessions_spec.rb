require "rails_helper"

RSpec.describe "Sessions", type: :request do
  describe "POST /api/v1/login" do
    it "returns a token and the user for valid credentials" do
      user = create(:user, password: "password123")

      post "/api/v1/login", params: { email: user.email, password: "password123" }

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["data"]).to include("token")
      expect(body.dig("data", "user", "email")).to eq(user.email)
    end

    it "matches the account regardless of email casing" do
      create(:user, email: "coach@example.com", password: "password123")

      post "/api/v1/login", params: { email: "Coach@Example.COM", password: "password123" }

      expect(response).to have_http_status(:created)
    end

    it "rejects invalid credentials" do
      post "/api/v1/login", params: { email: "nope@example.com", password: "wrong" }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body.dig("error", "code")).to eq("invalid_credentials")
    end
  end

  describe "DELETE /api/v1/logout" do
    it "revokes the token so it can't be reused" do
      user = create(:user)
      headers = auth_headers(user)

      delete "/api/v1/logout", headers: headers
      expect(response).to have_http_status(:no_content)

      get "/api/v1/me", headers: headers
      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects an unauthenticated logout" do
      delete "/api/v1/logout"

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
