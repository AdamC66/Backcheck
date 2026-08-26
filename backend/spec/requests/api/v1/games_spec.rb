require "rails_helper"

RSpec.describe "GET /api/v1/games/:id", type: :request do
  let(:league) { create(:league, slug: "nhl", abbreviation: "NHL") }
  let(:season) { create(:season, league: league, label: "2025-26") }
  let(:home_team) { create(:team, league: league, abbreviation: "TOR") }
  let(:away_team) { create(:team, league: league, abbreviation: "MTL") }
  let(:game) { create(:game, season: season, home_team: home_team, away_team: away_team) }
  let(:super_admin) { create(:user, is_super_admin: true) }

  it "returns the game plus basic and advanced stats for both teams" do
    skater = create(:player, first_name: "Auston", last_name: "Matthews")
    create(:skater_game_stat, game: game, player: skater, team: home_team, goals: 2)
    goalie = create(:player, first_name: "Anthony", last_name: "Stolarz")
    create(:goalie_game_stat, game: game, player: goalie, team: home_team, saves: 30, shots_against: 32)
    xg_model = create(:xg_model)
    create(:player_game_advanced_stat, game: game, player: skater, team: home_team, xg_model: xg_model,
           corsi_for: 10)
    create(:team_game_advanced_stat, game: game, team: home_team, corsi_for: 55)

    get "/api/v1/games/#{game.id}", headers: auth_headers(super_admin)

    expect(response).to have_http_status(:ok)
    body = response.parsed_body["data"]
    expect(body.dig("game", "id")).to eq(game.id)
    expect(body["skaters"].first.dig("player", "last_name")).to eq("Matthews")
    expect(body["skaters"].first["goals"]).to eq(2)
    expect(body["goalies"].first["saves"]).to eq(30)
    expect(body.dig("advanced", "players").first["corsi_for"]).to eq(10)
    expect(body.dig("advanced", "teams").first["corsi_for"]).to eq(55)
  end

  it "includes meta.stats_syncing only when the game is mid-recalculation" do
    get "/api/v1/games/#{game.id}", headers: auth_headers(super_admin)
    expect(response.parsed_body["meta"]).not_to have_key("stats_syncing")

    game.update!(stats_syncing: true)

    get "/api/v1/games/#{game.id}", headers: auth_headers(super_admin)
    expect(response.parsed_body.dig("meta", "stats_syncing")).to be true
  end

  it "404s for an unknown game" do
    get "/api/v1/games/999999", headers: auth_headers(super_admin)

    expect(response).to have_http_status(:not_found)
  end

  it "is visible to any logged-in user, not just one with a membership on it" do
    get "/api/v1/games/#{game.id}", headers: auth_headers(create(:user))

    expect(response).to have_http_status(:ok)
  end
end
