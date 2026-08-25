require "rails_helper"

RSpec.describe "GET /api/v1/teams/:team_id/affiliations", type: :request do
  it "lists a team's current-season affiliates" do
    parent_league = create(:league, tier: 1)
    affiliate_league = create(:league, tier: 2)
    season = create(:season, league: parent_league)
    parent_team = create(:team, league: parent_league)
    affiliate_team = create(:team, league: affiliate_league)
    create(:team_affiliation, parent_team: parent_team, affiliate_team: affiliate_team, season: season)

    get "/api/v1/teams/#{parent_team.id}/affiliations", headers: auth_headers(create(:user))

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["data"].map { |entry| entry.dig("team", "id") }).to eq([ affiliate_team.id ])
  end

  it "returns an empty list for a team with no affiliation on record" do
    team = create(:team)

    get "/api/v1/teams/#{team.id}/affiliations", headers: auth_headers(create(:user))

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["data"]).to eq([])
  end

  it "isn't fooled by a future season already backfilled ahead of the affiliation import" do
    parent_league = create(:league, tier: 1)
    affiliate_league = create(:league, tier: 2)
    season = create(:season, league: parent_league, starts_on: 1.year.ago, ends_on: 1.year.ago + 6.months)
    create(:season, league: parent_league, starts_on: 1.month.from_now, ends_on: 7.months.from_now)
    parent_team = create(:team, league: parent_league)
    affiliate_team = create(:team, league: affiliate_league)
    create(:team_affiliation, parent_team: parent_team, affiliate_team: affiliate_team, season: season)

    get "/api/v1/teams/#{parent_team.id}/affiliations", headers: auth_headers(create(:user))

    expect(response.parsed_body["data"].map { |entry| entry.dig("team", "id") }).to eq([ affiliate_team.id ])
  end
end
