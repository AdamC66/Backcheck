require "rails_helper"

RSpec.describe "GET /api/v1/players/:id", type: :request do
  let(:nhl) { create(:league, slug: "nhl", abbreviation: "NHL", tier: 1) }
  let(:leafs) { create(:team, league: nhl, abbreviation: "TOR") }
  let(:user) { create(:user, is_super_admin: true) }

  it "returns season-by-season basic and advanced stats across every team the player has played for" do
    player = create(:player, first_name: "Auston", last_name: "Matthews")
    kraken = create(:team, league: nhl, abbreviation: "SEA")
    season_one = create(:season, league: nhl, label: "2024-25", starts_on: Date.new(2024, 10, 1), ends_on: Date.new(2025, 6, 1))
    season_two = create(:season, league: nhl, label: "2025-26", starts_on: Date.new(2025, 10, 1), ends_on: Date.new(2026, 6, 1))
    create(:skater_season_stat, player: player, team: leafs, season: season_one, goals: 40)
    create(:skater_season_stat, player: player, team: kraken, season: season_two, goals: 45)
    game = create(:game, season: season_two, home_team: kraken)
    create(:player_season_advanced_stat, player: player, team: kraken, season: season_two,
                                        as_of_game: game, corsi_for: 30)

    get "/api/v1/players/#{player.id}", headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "player", "last_name")).to eq("Matthews")

    skater_seasons = response.parsed_body.dig("data", "skater_seasons")
    expect(skater_seasons.map { |row| row.dig("season", "label") }).to eq([ "2024-25", "2025-26" ])
    expect(skater_seasons.first.dig("team", "abbreviation")).to eq("TOR")
    expect(skater_seasons.last["goals"]).to eq(45)

    advanced_seasons = response.parsed_body.dig("data", "advanced_seasons")
    expect(advanced_seasons.size).to eq(1)
    expect(advanced_seasons.first["corsi_for"]).to eq(30)
    expect(response.parsed_body.dig("meta", "game_type")).to eq("regular_season")
  end

  it "scopes by game_type, same as team stats" do
    player = create(:player)
    season = create(:season, league: nhl)
    create(:skater_season_stat, player: player, team: leafs, season: season,
                               game_type: Game::GAME_TYPES[:regular_season], goals: 40)
    create(:skater_season_stat, player: player, team: leafs, season: season,
                               game_type: Game::GAME_TYPES[:playoffs], goals: 5)

    get "/api/v1/players/#{player.id}", params: { game_type: "playoffs" }, headers: auth_headers(user)

    expect(response.parsed_body.dig("data", "skater_seasons").first["goals"]).to eq(5)
  end

  it "404s for an unknown player" do
    get "/api/v1/players/999999", headers: auth_headers(user)

    expect(response).to have_http_status(:not_found)
  end

  it "reports current_team from the roster, not from stats — a rostered player may not have played yet" do
    season = create(:season, league: nhl)
    rostered_rookie = create(:player)
    create(:roster_spot, player: rostered_rookie, team: leafs, season: season)
    never_rostered = create(:player)

    get "/api/v1/players/#{rostered_rookie.id}", headers: auth_headers(user)
    expect(response.parsed_body.dig("data", "current_team", "abbreviation")).to eq("TOR")

    get "/api/v1/players/#{never_rostered.id}", headers: auth_headers(user)
    expect(response.parsed_body.dig("data", "current_team")).to be_nil
  end
end
