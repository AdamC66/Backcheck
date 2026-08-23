require "rails_helper"

RSpec.describe "GET /api/v1/teams/:team_id/roster", type: :request do
  let(:nhl) { create(:league, slug: "nhl", abbreviation: "NHL", tier: 1) }
  let(:ahl) { create(:league, slug: "ahl", abbreviation: "AHL", tier: 2) }
  let(:season) { create(:season, league: nhl, label: "2025-26") }
  let(:team) { create(:team, league: nhl, abbreviation: "TOR") }
  let(:super_admin) { create(:user, is_super_admin: true) }

  it "returns the team's roster with player details and jersey number" do
    player = create(:player, first_name: "Auston", last_name: "Matthews",
                            position: Player::POSITIONS[:center], nhl_player_id: 8479318)
    create(:roster_spot, player: player, team: team, season: season, jersey_number: 34,
                        contract_level: RosterSpot::CONTRACT_LEVELS[:nhl])

    get "/api/v1/teams/#{team.id}/roster", headers: auth_headers(super_admin)

    expect(response).to have_http_status(:ok)
    entry = response.parsed_body["data"].first
    expect(entry.dig("player", "last_name")).to eq("Matthews")
    expect(entry.dig("player", "headshot_url")).to eq("https://assets.nhle.com/mugs/nhl/latest/8479318.png")
    expect(entry["jersey_number"]).to eq(34)
    expect(entry["contract_level"]).to eq("nhl")
    expect(entry["assignment"]).to be_nil
    expect(response.parsed_body.dig("meta", "season")).to eq("2025-26")
  end

  it "surfaces where a player is currently assigned among the team's affiliates" do
    marlies = create(:team, league: ahl, abbreviation: "MRL", name: "Toronto Marlies")
    create(:team_affiliation, parent_team: team, affiliate_team: marlies, season: season)
    ahl_season = create(:season, league: ahl, label: "2025-26", starts_on: season.starts_on, ends_on: season.ends_on)

    player = create(:player, first_name: "Easton", last_name: "Cowan")
    create(:roster_spot, player: player, team: team, season: season,
                        contract_level: RosterSpot::CONTRACT_LEVELS[:nhl])
    create(:roster_spot, player: player, team: marlies, season: ahl_season,
                        contract_level: RosterSpot::CONTRACT_LEVELS[:ahl])

    get "/api/v1/teams/#{team.id}/roster", headers: auth_headers(super_admin)

    entry = response.parsed_body["data"].find { |e| e.dig("player", "last_name") == "Cowan" }
    expect(entry.dig("assignment", "team", "abbreviation")).to eq("MRL")
    expect(entry.dig("assignment", "team", "league", "slug")).to eq("ahl")
    expect(entry.dig("assignment", "contract_level")).to eq("ahl")
  end

  it "skips a newer season that's been seeded but has no roster yet" do
    create(:roster_spot, team: team, season: season)
    create(:season, league: nhl, label: "2026-27", starts_on: Date.new(2026, 10, 1), ends_on: Date.new(2027, 4, 1))

    get "/api/v1/teams/#{team.id}/roster", headers: auth_headers(super_admin)

    expect(response.parsed_body.dig("meta", "season")).to eq("2025-26")
  end

  it "hides a team the caller has no membership for" do
    team

    get "/api/v1/teams/#{team.id}/roster", headers: auth_headers(create(:user))

    expect(response).to have_http_status(:not_found)
  end
end
