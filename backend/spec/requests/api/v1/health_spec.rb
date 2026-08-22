require "rails_helper"

RSpec.describe "GET /api/v1/health", type: :request do
  it "responds ok without authentication" do
    get "/api/v1/health"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq("data" => { "status" => "ok" })
  end
end
