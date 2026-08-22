require "rails_helper"

RSpec.describe "GET /api/v1/teams/:team_id/games", type: :request do
  let(:league) { create(:league, slug: "nhl", abbreviation: "NHL") }
  let(:season) { create(:season, league: league, label: "2025-26") }
  let(:team) { create(:team, league: league, abbreviation: "TOR") }
  let(:opponent) { create(:team, league: league, abbreviation: "MTL") }
  let(:super_admin) { create(:user, is_super_admin: true) }

  it "returns the team's games chronologically, home and away" do
    away = create(:game, season: season, home_team: opponent, away_team: team,
                         game_date: Date.new(2025, 10, 8), starts_at: Time.utc(2025, 10, 8, 23))
    home = create(:game, season: season, home_team: team, away_team: opponent,
                         game_date: Date.new(2025, 10, 15), starts_at: Time.utc(2025, 10, 15, 23))

    get "/api/v1/teams/#{team.id}/games", headers: auth_headers(super_admin)

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["data"].map { |game| game["id"] }).to eq([ away.id, home.id ])
    expect(response.parsed_body.dig("data", 1, "home", "team", "abbreviation")).to eq("TOR")
    expect(response.parsed_body.dig("meta", "count")).to eq(2)
  end

  it "filters to the regular season on request" do
    create(:game, season: season, home_team: team, away_team: opponent,
                  game_type: Game::GAME_TYPES[:preseason])
    create(:game, season: season, home_team: team, away_team: opponent)

    get "/api/v1/teams/#{team.id}/games", params: { game_type: "regular_season" },
        headers: auth_headers(super_admin)

    expect(response.parsed_body["data"].map { |game| game["game_type"] }).to eq([ "regular_season" ])
  end

  it "hides a team the caller has no membership for" do
    team

    get "/api/v1/teams/#{team.id}/games", headers: auth_headers(create(:user))

    expect(response).to have_http_status(:not_found)
  end

  it "serves a team the caller is scoped to" do
    user = create(:user)
    create(:membership, user: user, scopeable: team)
    create(:game, season: season, home_team: team, away_team: opponent)

    get "/api/v1/teams/#{team.id}/games", headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["data"].size).to eq(1)
  end
end
