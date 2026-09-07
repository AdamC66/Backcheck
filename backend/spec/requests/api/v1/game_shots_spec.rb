require "rails_helper"

RSpec.describe "GET /api/v1/games/:game_id/shots", type: :request do
  let(:game) { create(:game) }
  let(:user) { create(:user) }

  before { create(:xg_model, active: true, coefficients: { intercept: 0, distance: 0, angle: 0 }) }

  it "returns one located shot per unblocked attempt with its xG and side" do
    shooter = create(:player, first_name: "Auston", last_name: "Matthews")
    create(:game_event, game: game, team: game.home_team, primary_player: shooter,
           event_type: GameEvent::EVENT_TYPES[:goal], x_coord: 80, y_coord: 4)
    create(:game_event, game: game, team: game.home_team, x_coord: nil, y_coord: nil)

    get "/api/v1/games/#{game.id}/shots", headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    shots = response.parsed_body["data"]
    expect(shots.size).to eq(1)
    expect(shots.first).to include(
      "team_side" => "home", "is_goal" => true, "shooter_name" => "Auston Matthews", "xg" => 0.5
    )
    expect(response.parsed_body.dig("meta", "unlocated_count")).to eq(1)
  end

  it "404s for an unknown game" do
    get "/api/v1/games/0/shots", headers: auth_headers(user)

    expect(response).to have_http_status(:not_found)
  end

  it "requires authentication" do
    get "/api/v1/games/#{game.id}/shots"

    expect(response).to have_http_status(:unauthorized)
  end
end
