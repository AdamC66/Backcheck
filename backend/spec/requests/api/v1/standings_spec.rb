require "rails_helper"

RSpec.describe "GET /api/v1/leagues/:league_slug/standings", type: :request do
  let(:league) { create(:league, slug: "nhl", abbreviation: "NHL") }
  let(:season) { create(:season, league: league, label: "2025-26") }
  let(:super_admin) { create(:user, is_super_admin: true) }

  def standing_for(team, attributes = {})
    create(:team_standing, { team: team, season: season, as_of_date: season.ends_on }.merge(attributes))
  end

  it "returns the latest snapshot per team, in league order" do
    leader = create(:team, league: league, abbreviation: "COL")
    chaser = create(:team, league: league, abbreviation: "DAL")
    standing_for(leader, league_sequence: 1, points: 121)
    standing_for(chaser, league_sequence: 2, points: 112)

    get "/api/v1/leagues/nhl/standings", headers: auth_headers(super_admin)

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["data"].map { |row| row.dig("team", "abbreviation") }).to eq(%w[COL DAL])
    expect(response.parsed_body.dig("data", 0, "points")).to eq(121)
    expect(response.parsed_body.dig("meta", "season")).to eq("2025-26")
  end

  it "ignores older snapshots unless a date is asked for" do
    team = create(:team, league: league)
    standing_for(team, as_of_date: Date.new(2026, 1, 1), points: 50)
    standing_for(team, as_of_date: Date.new(2026, 4, 17), points: 100)

    get "/api/v1/leagues/nhl/standings", headers: auth_headers(super_admin)
    expect(response.parsed_body["data"].map { |row| row["points"] }).to eq([ 100 ])

    get "/api/v1/leagues/nhl/standings", params: { date: "2026-01-01" }, headers: auth_headers(super_admin)
    expect(response.parsed_body["data"].map { |row| row["points"] }).to eq([ 50 ])
  end

  it "skips a newer season that's been seeded but has no standings yet" do
    team = create(:team, league: league)
    standing_for(team, points: 90)
    create(:season, league: league, label: "2026-27", starts_on: Date.new(2026, 10, 1), ends_on: Date.new(2027, 4, 1))

    get "/api/v1/leagues/nhl/standings", headers: auth_headers(super_admin)

    expect(response.parsed_body.dig("meta", "season")).to eq("2025-26")
  end

  it "returns the requested season empty rather than substituting one that has data" do
    team = create(:team, league: league)
    standing_for(team, points: 90)
    create(:season, league: league, label: "2026-27", starts_on: Date.new(2026, 10, 1), ends_on: Date.new(2027, 4, 1))

    get "/api/v1/leagues/nhl/standings", params: { season: "2026-27" }, headers: auth_headers(super_admin)

    expect(response.parsed_body["data"]).to eq([])
    expect(response.parsed_body.dig("meta", "season")).to eq("2026-27")
  end
end
