require "rails_helper"

RSpec.describe "GET /api/v1/admin/xg_model", type: :request do
  it "serves the active model and training runs to a super admin" do
    create(:xg_model, version: "v1", active: true, coefficients: { intercept: -1.2, distance: -0.03 })
    create(:xg_training_run, label: "baseline")

    get "/api/v1/admin/xg_model", headers: auth_headers(create(:user, is_super_admin: true))

    expect(response).to have_http_status(:ok)
    body = response.parsed_body["data"]
    expect(body["active_model"]).to include("version" => "v1")
    expect(body["active_model"]["coefficients"]).to include("distance" => -0.03)
    expect(body["training_runs"].first).to include("label" => "baseline", "status" => "exported")
  end

  it "returns a null active model when none is active" do
    get "/api/v1/admin/xg_model", headers: auth_headers(create(:user, is_super_admin: true))

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "active_model")).to be_nil
  end

  it "rejects a non-super-admin" do
    get "/api/v1/admin/xg_model", headers: auth_headers(create(:user))

    expect(response).to have_http_status(:forbidden)
  end
end
