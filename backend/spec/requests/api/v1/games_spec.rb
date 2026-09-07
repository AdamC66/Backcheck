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

  it "includes the zone-occupancy timeline and per-skater zone time" do
    skater = create(:player, first_name: "Morgan", last_name: "Rielly")
    create(:shift, game: game, team: home_team, player: skater, period: 1,
           start_time_seconds: 0, end_time_seconds: 60)
    create(:game_event, game: game, team: home_team, primary_player: skater,
           event_type: GameEvent::EVENT_TYPES[:faceoff], period: 1, period_time_seconds: 0, x_coord: 0,
           home_team_defending_side: GameEvent::DEFENDING_SIDES[:left])
    create(:player_game_zone_time, game: game, player: skater, team: home_team,
           offensive_starts: 4, neutral_seconds: 55)

    get "/api/v1/games/#{game.id}", headers: auth_headers(super_admin)

    zone_time = response.parsed_body.dig("data", "zone_time")
    expect(zone_time.dig("periods", 0, "period")).to eq(1)
    expect(zone_time.dig("totals", "neutral_seconds")).to eq(60)
    expect(zone_time.dig("skaters", 0, "player", "last_name")).to eq("Rielly")
    expect(zone_time.dig("skaters", 0, "starts", "offensive")).to eq(4)
    expect(zone_time.dig("skaters", 0, "seconds", "neutral")).to eq(55)
  end

  it "includes goal and penalty events with their attribution detail" do
    scorer = create(:player, last_name: "Marner")
    assist = create(:player, last_name: "Tavares")
    create(:game_event, game: game, team: home_team, primary_player: scorer, secondary_player: assist,
           event_type: GameEvent::EVENT_TYPES[:goal], period: 1, period_time_seconds: 120,
           strength_state: GameEvent::STRENGTH_STATES[:power_play])
    penalized = create(:player, last_name: "Reaves")
    create(:game_event, game: game, team: away_team, primary_player: penalized,
           event_type: GameEvent::EVENT_TYPES[:penalty], period: 2, period_time_seconds: 300,
           infraction: "roughing", penalty_type: GameEvent::PENALTY_TYPES[:minor], penalty_minutes: 2)

    get "/api/v1/games/#{game.id}", headers: auth_headers(super_admin)

    goal = response.parsed_body.dig("data", "goals").first
    expect(goal.dig("scorer", "last_name")).to eq("Marner")
    expect(goal.dig("assists", 0, "last_name")).to eq("Tavares")
    expect(goal["strength_state"]).to eq("power_play")

    penalty = response.parsed_body.dig("data", "penalties").first
    expect(penalty.dig("committed_by", "last_name")).to eq("Reaves")
    expect(penalty["infraction"]).to eq("roughing")
    expect(penalty["penalty_minutes"]).to eq(2)
  end

  it "derives period-by-period score and shots-on-goal from game events" do
    shooter = create(:player, last_name: "Nylander")
    create(:game_event, game: game, team: home_team, primary_player: shooter,
           event_type: GameEvent::EVENT_TYPES[:goal], period: 1, period_time_seconds: 60)
    create(:game_event, game: game, team: home_team, primary_player: shooter,
           event_type: GameEvent::EVENT_TYPES[:shot], period: 1, period_time_seconds: 120)
    create(:game_event, game: game, team: away_team, primary_player: shooter,
           event_type: GameEvent::EVENT_TYPES[:shot], period: 2, period_time_seconds: 30)

    get "/api/v1/games/#{game.id}", headers: auth_headers(super_admin)

    summary = response.parsed_body.dig("data", "period_summary")
    expect(summary.dig("periods", 0, "period")).to eq(1)
    expect(summary.dig("periods", 0, "home")).to eq("goals" => 1, "shots_on_goal" => 2)
    expect(summary.dig("totals", "home", "shots_on_goal")).to eq(2)
    expect(summary.dig("totals", "away", "shots_on_goal")).to eq(1)
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
