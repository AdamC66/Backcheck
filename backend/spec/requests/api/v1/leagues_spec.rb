require "rails_helper"

RSpec.describe "GET /api/v1/leagues", type: :request do
  it "returns every league to a super admin, ranked by tier" do
    create(:league, name: "ECHL", abbreviation: "ECHL", tier: 3)
    create(:league, name: "National Hockey League", abbreviation: "NHL", tier: 1)
    create(:league, name: "American Hockey League", abbreviation: "AHL", tier: 2)

    get "/api/v1/leagues", headers: auth_headers(create(:user, is_super_admin: true))

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["data"].map { |league| league["abbreviation"] }).to eq(%w[NHL AHL ECHL])
  end

  it "returns only the leagues a scoped user belongs to" do
    user = create(:user)
    team = create(:team)
    create(:league)
    create(:membership, user: user, scopeable: team)

    get "/api/v1/leagues", headers: auth_headers(user)

    expect(response.parsed_body["data"].map { |league| league["id"] }).to eq([ team.league_id ])
  end
end
