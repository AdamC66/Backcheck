require "rails_helper"

RSpec.describe "POST /api/v1/login", type: :request do
  it "returns a token for valid credentials" do
    user = create(:user, password: "password123")

    post "/api/v1/login", params: { email: user.email, password: "password123" }

    expect(response).to have_http_status(:created)
    expect(JSON.parse(response.body)).to have_key("token")
  end

  it "rejects invalid credentials" do
    post "/api/v1/login", params: { email: "nope@example.com", password: "wrong" }

    expect(response).to have_http_status(:unauthorized)
  end
end
