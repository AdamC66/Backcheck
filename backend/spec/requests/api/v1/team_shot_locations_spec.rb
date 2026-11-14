require "rails_helper"

RSpec.describe "GET /api/v1/teams/:team_id/shot_locations", type: :request do
  let(:league) { create(:league, slug: "nhl", abbreviation: "NHL") }
  let(:season) { create(:season, league: league, label: "2025-26") }
  let(:team) { create(:team, league: league, abbreviation: "TOR") }
  let(:opponent) { create(:team, league: league, abbreviation: "MTL") }
  let(:game) do
    create(:game, season: season, home_team: team, away_team: opponent,
           game_type: Game::GAME_TYPES[:regular_season], state: "FINAL")
  end
  let(:user) { create(:user) }

  it "splits located shots into for and against, each with its strength state" do
    create(:game_event, game: game, team: team, event_type: GameEvent::EVENT_TYPES[:goal],
           x_coord: 80, y_coord: 4, strength_state: GameEvent::STRENGTH_STATES[:power_play])
    create(:game_event, game: game, team: opponent, x_coord: -70, y_coord: -6,
           strength_state: GameEvent::STRENGTH_STATES[:even_strength])

    get "/api/v1/teams/#{team.id}/shot_locations?season=2025-26", headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    body = response.parsed_body["data"]
    expect(body["for"]).to contain_exactly(
      hash_including("is_goal" => true, "strength_state" => "power_play")
    )
    expect(body["for"].first["x"].to_f).to eq(80.0)
    expect(body["against"]).to contain_exactly(
      hash_including("is_goal" => false, "strength_state" => "even_strength")
    )
    expect(response.parsed_body.dig("meta", "season")).to eq("2025-26")
  end

  it "422s on an unknown game_type" do
    get "/api/v1/teams/#{team.id}/shot_locations?game_type=scrimmage", headers: auth_headers(user)

    expect(response).to have_http_status(:unprocessable_content)
  end

  it "requires authentication" do
    get "/api/v1/teams/#{team.id}/shot_locations"

    expect(response).to have_http_status(:unauthorized)
  end
end
