require "rails_helper"

RSpec.describe "GET /api/v1/teams/:team_id/stats", type: :request do
  let(:nhl) { create(:league, slug: "nhl", abbreviation: "NHL", tier: 1) }
  let(:season) { create(:season, league: nhl, label: "2025-26") }
  let(:team) { create(:team, league: nhl, abbreviation: "TOR") }
  let(:super_admin) { create(:user, is_super_admin: true) }

  it "returns skater and goalie season totals with derived rate stats" do
    skater = create(:player, first_name: "Auston", last_name: "Matthews")
    create(:skater_season_stat, player: skater, team: team, season: season, goals: 40, assists: 30)
    goalie = create(:player, first_name: "Anthony", last_name: "Stolarz")
    create(:goalie_season_stat, player: goalie, team: team, season: season,
                               shots_against: 1000, saves: 900, goals_against: 100,
                               time_on_ice_seconds: 216_000)

    get "/api/v1/teams/#{team.id}/stats", headers: auth_headers(super_admin)

    expect(response).to have_http_status(:ok)
    skater_entry = response.parsed_body.dig("data", "skaters").first
    expect(skater_entry.dig("player", "last_name")).to eq("Matthews")
    expect(skater_entry["goals"]).to eq(40)

    goalie_entry = response.parsed_body.dig("data", "goalies").first
    expect(goalie_entry["save_pctg"]).to eq(0.9)
    expect(goalie_entry["goals_against_average"]).to eq(1.67)
    expect(response.parsed_body.dig("meta", "game_type")).to eq("regular_season")
  end

  it "defaults to regular season and only includes playoffs when asked" do
    player = create(:player)
    create(:skater_season_stat, player: player, team: team, season: season,
                               game_type: Game::GAME_TYPES[:regular_season], goals: 40)
    create(:skater_season_stat, player: player, team: team, season: season,
                               game_type: Game::GAME_TYPES[:playoffs], goals: 5)

    get "/api/v1/teams/#{team.id}/stats", headers: auth_headers(super_admin)
    expect(response.parsed_body.dig("data", "skaters").first["goals"]).to eq(40)

    get "/api/v1/teams/#{team.id}/stats", params: { game_type: "playoffs" }, headers: auth_headers(super_admin)
    expect(response.parsed_body.dig("data", "skaters").first["goals"]).to eq(5)
  end

  it "rejects an unrecognized game_type" do
    get "/api/v1/teams/#{team.id}/stats", params: { game_type: "bogus" }, headers: auth_headers(super_admin)

    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body.dig("error", "code")).to eq("invalid_parameter")
  end

  it "returns each player's latest advanced-stat snapshot, not every chained row, plus the team's totals" do
    skater = create(:player, first_name: "Auston", last_name: "Matthews")
    earlier_game = create(:game, season: season, home_team: team, starts_at: Time.utc(2025, 10, 8))
    later_game = create(:game, season: season, home_team: team, starts_at: Time.utc(2025, 10, 15))
    create(:player_season_advanced_stat, player: skater, team: team, season: season,
                                        as_of_game: earlier_game, games_played: 1, corsi_for: 10)
    create(:player_season_advanced_stat, player: skater, team: team, season: season,
                                        as_of_game: later_game, games_played: 2, corsi_for: 22)
    create(:team_season_advanced_stat, team: team, season: season, corsi_for: 100)

    get "/api/v1/teams/#{team.id}/stats", headers: auth_headers(super_admin)

    advanced_players = response.parsed_body.dig("data", "advanced", "players")
    expect(advanced_players.size).to eq(1)
    expect(advanced_players.first["games_played"]).to eq(2)
    expect(advanced_players.first["corsi_for"]).to eq(22)

    advanced_team = response.parsed_body.dig("data", "advanced", "team")
    expect(advanced_team.first["corsi_for"]).to eq(100)
  end

  it "scopes advanced stats by game_type, same as basic stats — preseason distinct from regular season" do
    regular_game = create(:game, season: season, home_team: team, game_type: Game::GAME_TYPES[:regular_season])
    preseason_game = create(:game, season: season, home_team: team, game_type: Game::GAME_TYPES[:preseason])
    create(:team_season_advanced_stat, team: team, season: season, corsi_for: 500,
           game_type: Game::GAME_TYPES[:regular_season])
    create(:team_season_advanced_stat, team: team, season: season, corsi_for: 12,
           game_type: Game::GAME_TYPES[:preseason])
    create(:player_season_advanced_stat, player: create(:player), team: team, season: season,
           as_of_game: regular_game, game_type: Game::GAME_TYPES[:regular_season], corsi_for: 30)
    create(:player_season_advanced_stat, player: create(:player), team: team, season: season,
           as_of_game: preseason_game, game_type: Game::GAME_TYPES[:preseason], corsi_for: 3)

    get "/api/v1/teams/#{team.id}/stats", headers: auth_headers(super_admin)
    expect(response.parsed_body.dig("data", "advanced", "team").first["corsi_for"]).to eq(500)
    expect(response.parsed_body.dig("data", "advanced", "players").first["corsi_for"]).to eq(30)

    get "/api/v1/teams/#{team.id}/stats", params: { game_type: "preseason" }, headers: auth_headers(super_admin)
    expect(response.parsed_body.dig("data", "advanced", "team").first["corsi_for"]).to eq(12)
    expect(response.parsed_body.dig("data", "advanced", "players").first["corsi_for"]).to eq(3)
  end
end
