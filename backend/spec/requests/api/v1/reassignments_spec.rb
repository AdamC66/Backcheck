require "rails_helper"

RSpec.describe "PATCH /api/v1/teams/:team_id/reassignments/:player_id", type: :request do
  let(:parent_league) { create(:league, tier: 1) }
  let(:affiliate_league) { create(:league, tier: 2) }
  let!(:parent_season) { create(:season, league: parent_league) }
  let!(:affiliate_season) { create(:season, league: affiliate_league) }
  let(:parent_team) { create(:team, league: parent_league) }
  let(:affiliate_team) { create(:team, league: affiliate_league) }
  let!(:affiliation) do
    create(:team_affiliation, parent_team: parent_team, affiliate_team: affiliate_team, season: parent_season)
  end
  let(:player) { create(:player) }
  let(:gm_role) { create(:role, key: "gm", scope_type: "team") }

  def gm_for(team)
    user = create(:user)
    create(:membership, user: user, role: gm_role, scopeable: team)
    user
  end

  it "sends a player down from the parent team to its affiliate" do
    create(:roster_spot, player: player, team: parent_team, season: parent_season)

    patch "/api/v1/teams/#{parent_team.id}/reassignments/#{player.id}",
          params: { destination_team_id: affiliate_team.id }, headers: auth_headers(gm_for(parent_team))

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "team", "id")).to eq(affiliate_team.id)
    expect(RosterSpot.find_by(player: player, team: affiliate_team, season: affiliate_season)).to be_present
  end

  it "calls a player up from the affiliate back to the parent team" do
    create(:roster_spot, player: player, team: affiliate_team, season: affiliate_season)

    patch "/api/v1/teams/#{parent_team.id}/reassignments/#{player.id}", headers: auth_headers(gm_for(parent_team))

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "team", "id")).to eq(parent_team.id)
    expect(RosterSpot.find_by(player: player, team: parent_team, season: parent_season)).to be_present
  end

  it "rejects the affiliate's own GM initiating the same move" do
    create(:roster_spot, player: player, team: affiliate_team, season: affiliate_season)

    patch "/api/v1/teams/#{parent_team.id}/reassignments/#{player.id}", headers: auth_headers(gm_for(affiliate_team))

    expect(response).to have_http_status(:forbidden)
  end

  it "rejects a destination team outside any existing affiliation" do
    create(:roster_spot, player: player, team: parent_team, season: parent_season)
    other_team = create(:team)

    patch "/api/v1/teams/#{parent_team.id}/reassignments/#{player.id}",
          params: { destination_team_id: other_team.id }, headers: auth_headers(gm_for(parent_team))

    expect(response).to have_http_status(:not_found)
  end
end
