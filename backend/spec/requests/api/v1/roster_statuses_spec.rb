require "rails_helper"

RSpec.describe "PATCH /api/v1/teams/:team_id/roster_statuses/:player_id", type: :request do
  let(:league) { create(:league) }
  let(:season) { create(:season, league: league) }
  let(:team) { create(:team, league: league) }
  let(:player) { create(:player) }
  let!(:roster_spot) { create(:roster_spot, player: player, team: team, season: season) }
  let(:gm_role) { create(:role, key: "gm", scope_type: "team") }

  def gm_for(team)
    user = create(:user)
    create(:membership, user: user, role: gm_role, scopeable: team)
    user
  end

  it "places a player on injured reserve as of today by default" do
    patch "/api/v1/teams/#{team.id}/roster_statuses/#{player.id}",
          params: { status: "injured_reserve" }, headers: auth_headers(gm_for(team))

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["data"]).to eq(
      "player_id" => player.id, "status" => "injured_reserve", "started_on" => Date.current.to_s
    )
  end

  it "backdates a retroactive placement" do
    patch "/api/v1/teams/#{team.id}/roster_statuses/#{player.id}",
          params: { status: "injured_reserve", effective_on: "2026-08-20" },
          headers: auth_headers(gm_for(team))

    expect(response.parsed_body.dig("data", "started_on")).to eq("2026-08-20")
  end

  it "rejects a user who isn't the team's GM" do
    patch "/api/v1/teams/#{team.id}/roster_statuses/#{player.id}",
          params: { status: "injured_reserve" }, headers: auth_headers(create(:user))

    expect(response).to have_http_status(:forbidden)
  end

  it "rejects a player who isn't on this team's roster" do
    other_player = create(:player)

    patch "/api/v1/teams/#{team.id}/roster_statuses/#{other_player.id}",
          params: { status: "injured_reserve" }, headers: auth_headers(gm_for(team))

    expect(response).to have_http_status(:not_found)
  end

  it "rejects an unknown status value" do
    patch "/api/v1/teams/#{team.id}/roster_statuses/#{player.id}",
          params: { status: "benched" }, headers: auth_headers(gm_for(team))

    expect(response).to have_http_status(:unprocessable_content)
  end
end
