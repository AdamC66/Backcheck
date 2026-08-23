require "rails_helper"

RSpec.describe "GET /api/v1/leagues/:league_slug/games", type: :request do
  let(:league) { create(:league, slug: "nhl", abbreviation: "NHL") }
  let(:season) { create(:season, league: league, label: "2025-26") }
  let(:home) { create(:team, league: league, abbreviation: "TOR") }
  let(:away) { create(:team, league: league, abbreviation: "MTL") }
  let(:super_admin) { create(:user, is_super_admin: true) }

  def games_on(date, count, attributes = {})
    Array.new(count) do
      create(:game, { season: season, home_team: home, away_team: away, game_date: date,
                      starts_at: date.to_time(:utc) }.merge(attributes))
    end
  end

  def get_games(params = {})
    get "/api/v1/leagues/nhl/games", params: params, headers: auth_headers(super_admin)
    response.parsed_body
  end

  it "takes whole dates until it has the requested number of games" do
    games_on(Date.new(2026, 1, 5), 4)
    games_on(Date.new(2026, 1, 6), 4)
    games_on(Date.new(2026, 1, 7), 4)
    games_on(Date.new(2026, 1, 8), 4)

    body = get_games(date: "2026-01-05", limit: 10)

    expect(body.dig("meta", "dates")).to eq(%w[2026-01-05 2026-01-06 2026-01-07])
    expect(body.dig("meta", "count")).to eq(12)
  end

  it "never splits a date, even when one alone exceeds the limit" do
    games_on(Date.new(2026, 1, 5), 16)
    games_on(Date.new(2026, 1, 6), 4)

    body = get_games(date: "2026-01-05", limit: 5)

    expect(body.dig("meta", "dates")).to eq([ "2026-01-05" ])
    expect(body.dig("meta", "count")).to eq(16)
  end

  it "defaults to today, and falls back to the most recent games out of season" do
    games_on(Date.current - 100, 3)

    body = get_games

    expect(body.dig("meta", "dates")).to eq([ (Date.current - 100).to_s ])
  end

  it "rejects a malformed date and an unknown direction" do
    season

    expect(get_games(date: "last tuesday").dig("error", "code")).to eq("invalid_parameter")
    expect(response).to have_http_status(:unprocessable_content)

    expect(get_games(direction: "sideways").dig("error", "message")).to match(/direction/)
  end
end
