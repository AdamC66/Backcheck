require "rails_helper"

RSpec.describe "Team lineups", type: :request do
  let(:league) { create(:league) }
  let(:season) { create(:season, league: league) }
  let(:home) { create(:team, league: league) }
  let(:away) { create(:team, league: league) }
  let(:game) { create(:game, season: season, home_team: home, away_team: away, starts_at: 3.days.from_now) }
  let(:coaching_role) { create(:role, key: "coaching_staff", scope_type: "team") }

  def coach_for(team)
    user = create(:user)
    create(:membership, user: user, role: coaching_role, scopeable: team)
    user
  end

  def roster_player
    create(:player).tap { |player| create(:roster_spot, player: player, team: home, season: season) }
  end

  def lineup_body
    {
      forward_lines: Array.new(12) { roster_player.id }.each_slice(3).to_a,
      defense_pairs: Array.new(6) { roster_player.id }.each_slice(2).to_a,
      starting_goalie_id: roster_player.id
    }
  end

  it "lets a coach set their own team's lineup" do
    put "/api/v1/teams/#{home.id}/lineups/#{game.id}",
        params: lineup_body, headers: auth_headers(coach_for(home)), as: :json

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "forward_lines").size).to eq(4)
  end

  it "forbids a coach on the opposing team" do
    put "/api/v1/teams/#{home.id}/lineups/#{game.id}",
        params: lineup_body, headers: auth_headers(coach_for(away)), as: :json

    expect(response).to have_http_status(:forbidden)
  end

  it "hides an active lineup from outside the team, then reveals it once the game starts" do
    create(:lineup, game: game, team: home)

    get "/api/v1/teams/#{home.id}/lineups/#{game.id}", headers: auth_headers(create(:user))
    expect(response).to have_http_status(:not_found)

    game.update!(starts_at: 1.hour.ago)
    get "/api/v1/teams/#{home.id}/lineups/#{game.id}", headers: auth_headers(create(:user))
    expect(response).to have_http_status(:ok)
  end

  it "locks the lineup against edits once the game has started" do
    game.update!(starts_at: 1.hour.ago)

    put "/api/v1/teams/#{home.id}/lineups/#{game.id}",
        params: lineup_body, headers: auth_headers(coach_for(home)), as: :json

    expect(response).to have_http_status(:forbidden)
  end

  it "lets a super admin backfill a lineup for a game that's already been played" do
    game.update!(starts_at: 1.hour.ago)

    put "/api/v1/teams/#{home.id}/lineups/#{game.id}",
        params: lineup_body, headers: auth_headers(create(:user, is_super_admin: true)), as: :json

    expect(response).to have_http_status(:ok)
  end
end
