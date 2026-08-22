require "rails_helper"

RSpec.describe "GET /api/v1/leagues/:league_slug/games", type: :request do
  let(:league) { create(:league, slug: "nhl", abbreviation: "NHL") }
  let(:season) { create(:season, league: league, label: "2025-26") }
  let(:home) { create(:team, league: league, abbreviation: "TOR") }
  let(:away) { create(:team, league: league, abbreviation: "MTL") }
  let(:super_admin) { create(:user, is_super_admin: true) }

  def game_on(date, attributes = {})
    create(:game, { season: season, home_team: home, away_team: away, game_date: date,
                    starts_at: date.to_time(:utc) }.merge(attributes))
  end

  it "returns the games in the requested range" do
    game_on(Date.new(2026, 4, 14))
    wanted = game_on(Date.new(2026, 4, 15))
    game_on(Date.new(2026, 4, 20))

    get "/api/v1/leagues/nhl/games", params: { from: "2026-04-15", to: "2026-04-16" },
        headers: auth_headers(super_admin)

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["data"].map { |game| game["id"] }).to eq([ wanted.id ])
    expect(response.parsed_body["meta"]).to include("from" => "2026-04-15", "to" => "2026-04-16",
                                                    "count" => 1)
  end

  it "defaults to the last date with games, since today is empty all summer" do
    game_on(Date.new(2026, 4, 14))
    latest = game_on(Date.new(2026, 4, 17))

    get "/api/v1/leagues/nhl/games", headers: auth_headers(super_admin)

    expect(response.parsed_body["data"].map { |game| game["id"] }).to eq([ latest.id ])
    expect(response.parsed_body.dig("meta", "from")).to eq("2026-04-17")
  end

  it "refuses a range wider than the cap rather than loading a season" do
    season

    get "/api/v1/leagues/nhl/games", params: { from: "2025-10-01", to: "2026-04-17" },
        headers: auth_headers(super_admin)

    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body.dig("error", "code")).to eq("invalid_range")
  end

  it "rejects a malformed date instead of silently defaulting" do
    season

    get "/api/v1/leagues/nhl/games", params: { from: "last tuesday" },
        headers: auth_headers(super_admin)

    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body.dig("error", "message")).to match(/YYYY-MM-DD/)
  end

  it "rejects a backwards range" do
    season

    get "/api/v1/leagues/nhl/games", params: { from: "2026-04-17", to: "2026-04-01" },
        headers: auth_headers(super_admin)

    expect(response).to have_http_status(:unprocessable_content)
  end

  it "filters to the regular season on request" do
    game_on(Date.new(2026, 4, 15), game_type: Game::GAME_TYPES[:playoffs])
    regular = game_on(Date.new(2026, 4, 15))

    get "/api/v1/leagues/nhl/games", params: { from: "2026-04-15", game_type: "regular_season" },
        headers: auth_headers(super_admin)

    expect(response.parsed_body["data"].map { |game| game["id"] }).to eq([ regular.id ])
  end

  it "hides a league the caller can't see" do
    season

    get "/api/v1/leagues/nhl/games", headers: auth_headers(create(:user))

    expect(response).to have_http_status(:not_found)
  end
end
