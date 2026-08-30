require "rails_helper"

RSpec.describe "GET /api/v1/danger_zones", type: :request do
  it "returns the danger-zone geometry" do
    get "/api/v1/danger_zones", headers: auth_headers(create(:user))

    expect(response).to have_http_status(:ok)
    body = response.parsed_body["data"]
    expect(body["goal_line_x"]).to eq(89)
    expect(body["high_danger_polygon"]).to eq(DangerZone::HIGH_DANGER_POLYGON.map(&:to_a))
    expect(body["mid_range_max_distance_ft"]).to eq(60)
  end

  it "requires authentication" do
    get "/api/v1/danger_zones"

    expect(response).to have_http_status(:unauthorized)
  end
end
