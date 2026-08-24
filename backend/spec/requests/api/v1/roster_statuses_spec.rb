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

RSpec.describe "GET /api/v1/roster_statuses", type: :request do
  let(:league) { create(:league) }
  let(:season) { create(:season, league: league) }
  let(:team) { create(:team, league: league) }
  let(:player) { create(:player) }

  it "lists a team's transaction history for a season, newest first" do
    older = create(:roster_status, player: player, team: team, season: season,
                                    status: RosterStatus::STATUSES[:injured_reserve],
                                    started_on: 2.weeks.ago.to_date, ended_on: 1.week.ago.to_date)
    newer = create(:roster_status, player: create(:player), team: team, season: season,
                                    status: RosterStatus::STATUSES[:non_roster], started_on: 1.day.ago.to_date)

    get "/api/v1/roster_statuses", params: { team_id: team.id, season: season.label },
                                    headers: auth_headers(create(:user))

    expect(response).to have_http_status(:ok)
    body = response.parsed_body
    expect(body["data"].map { |entry| entry["player_id"] }).to eq([ newer.player_id, older.player_id ])
    expect(body.dig("meta", "total_count")).to eq(2)
  end

  it "paginates results" do
    3.times do |i|
      create(:roster_status, player: create(:player), team: team, season: season,
                              status: RosterStatus::STATUSES[:non_roster], started_on: i.days.ago.to_date)
    end

    get "/api/v1/roster_statuses", params: { team_id: team.id, per_page: 2, page: 2 },
                                    headers: auth_headers(create(:user))

    expect(response.parsed_body["data"].size).to eq(1)
    expect(response.parsed_body.dig("meta", "total_pages")).to eq(2)
  end
end
