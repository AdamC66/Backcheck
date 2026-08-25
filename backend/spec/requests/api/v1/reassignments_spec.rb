require "rails_helper"

RSpec.describe "PATCH /api/v1/teams/:team_id/reassignments/:player_id", type: :request do
  let(:parent_league) { create(:league, slug: "nhl", tier: 1) }
  let(:affiliate_league) { create(:league, slug: "ahl", tier: 2) }
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

  it "sends a player down from the parent team to its affiliate, leaving the parent's own spot untouched" do
    parent_spot = create(:roster_spot, player: player, team: parent_team, season: parent_season)

    patch "/api/v1/teams/#{parent_team.id}/reassignments/#{player.id}",
          params: { destination_team_id: affiliate_team.id }, headers: auth_headers(gm_for(parent_team))

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "team", "id")).to eq(affiliate_team.id)
    affiliate_spot = RosterSpot.find_by(player: player, team: affiliate_team, season: affiliate_season)
    expect(affiliate_spot.contract_level).to eq(RosterSpot::CONTRACT_LEVELS[:ahl])
    expect(parent_spot.reload).to be_present
  end

  it "sends a player down onto an existing (e.g. already feed-synced) destination spot rather than erroring" do
    create(:roster_spot, player: player, team: parent_team, season: parent_season)
    existing = create(:roster_spot, player: player, team: affiliate_team, season: affiliate_season,
                                    contract_level: RosterSpot::CONTRACT_LEVELS[:nhl])

    patch "/api/v1/teams/#{parent_team.id}/reassignments/#{player.id}",
          params: { destination_team_id: affiliate_team.id }, headers: auth_headers(gm_for(parent_team))

    expect(response).to have_http_status(:ok)
    expect(existing.reload.contract_level).to eq(RosterSpot::CONTRACT_LEVELS[:ahl])
  end

  it "calls a player up from the affiliate back to the parent team, re-tagging the affiliate spot instead of deleting it" do
    affiliate_spot = create(:roster_spot, player: player, team: affiliate_team, season: affiliate_season,
                                          contract_level: RosterSpot::CONTRACT_LEVELS[:ahl])

    patch "/api/v1/teams/#{parent_team.id}/reassignments/#{player.id}", headers: auth_headers(gm_for(parent_team))

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "team", "id")).to eq(parent_team.id)
    parent_spot = RosterSpot.find_by(player: player, team: parent_team, season: parent_season)
    expect(parent_spot.contract_level).to eq(RosterSpot::CONTRACT_LEVELS[:nhl])
    expect(affiliate_spot.reload.contract_level).to eq(RosterSpot::CONTRACT_LEVELS[:nhl])
  end

  it "still infers a call-up when the player also already has a parent-side spot (the normal post-send-down state)" do
    create(:roster_spot, player: player, team: parent_team, season: parent_season,
                        contract_level: RosterSpot::CONTRACT_LEVELS[:nhl])
    create(:roster_spot, player: player, team: affiliate_team, season: affiliate_season,
                        contract_level: RosterSpot::CONTRACT_LEVELS[:ahl])

    patch "/api/v1/teams/#{parent_team.id}/reassignments/#{player.id}", headers: auth_headers(gm_for(parent_team))

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "team", "id")).to eq(parent_team.id)
  end

  it "calls a player up onto the parent's own current roster season, even when that differs from the affiliation's season" do
    create(:roster_spot, player: player, team: affiliate_team, season: affiliate_season,
                        contract_level: RosterSpot::CONTRACT_LEVELS[:ahl])
    next_parent_season = create(:season, league: parent_league, starts_on: 1.year.from_now,
                                         ends_on: 1.year.from_now + 6.months)
    create(:roster_spot, team: parent_team, season: next_parent_season)

    patch "/api/v1/teams/#{parent_team.id}/reassignments/#{player.id}", headers: auth_headers(gm_for(parent_team))

    expect(response).to have_http_status(:ok)
    expect(RosterSpot.find_by(player: player, team: parent_team, season: next_parent_season)).to be_present
    expect(RosterSpot.find_by(player: player, team: parent_team, season: parent_season)).to be_nil
  end

  it "rejects the affiliate's own GM initiating the same move" do
    create(:roster_spot, player: player, team: affiliate_team, season: affiliate_season)

    patch "/api/v1/teams/#{parent_team.id}/reassignments/#{player.id}", headers: auth_headers(gm_for(affiliate_team))

    expect(response).to have_http_status(:forbidden)
  end

  it "still finds the affiliation and destination roster when a future season is already backfilled" do
    create(:roster_spot, player: player, team: parent_team, season: parent_season)
    create(:season, league: parent_league, starts_on: 1.month.from_now, ends_on: 7.months.from_now)
    create(:season, league: affiliate_league, starts_on: 1.month.from_now, ends_on: 7.months.from_now)

    patch "/api/v1/teams/#{parent_team.id}/reassignments/#{player.id}",
          params: { destination_team_id: affiliate_team.id }, headers: auth_headers(gm_for(parent_team))

    expect(response).to have_http_status(:ok)
    expect(RosterSpot.find_by(player: player, team: affiliate_team, season: affiliate_season)).to be_present
  end

  it "rejects a destination team outside any existing affiliation" do
    create(:roster_spot, player: player, team: parent_team, season: parent_season)
    other_team = create(:team)

    patch "/api/v1/teams/#{parent_team.id}/reassignments/#{player.id}",
          params: { destination_team_id: other_team.id }, headers: auth_headers(gm_for(parent_team))

    expect(response).to have_http_status(:not_found)
  end
end
