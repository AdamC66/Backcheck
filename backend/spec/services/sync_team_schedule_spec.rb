require "rails_helper"

RSpec.describe SyncTeamSchedule do
  let(:league) { create(:league, slug: "nhl", abbreviation: "NHL") }
  let!(:season) { create(:season, league: league, nhl_season_id: 20252026) }
  let!(:leafs) { create(:team, league: league, abbreviation: "TOR", name: "Toronto Maple Leafs") }

  before do
    %w[OTT MTL NYR].each { |abbrev| create(:team, league: league, abbreviation: abbrev) }
    stub_nhl("/v1/club-schedule-season/TOR/20252026", fixture: "club_schedule_season")
  end

  def sync
    described_class.new(team: leafs, season: season, client: unthrottled_client).call
  end

  it "creates games with scores, type, and outcome" do
    games = sync

    expect(games).to all(be_persisted)
    game = Game.find_by(nhl_game_id: 2025010010)
    expect(game).to have_attributes(
      season: season, game_type: Game::GAME_TYPES[:preseason],
      game_date: Date.new(2025, 9, 21), state: "FINAL",
      home_score: 3, away_score: 4, last_period_type: "REG"
    )
    expect(game.away_team).to eq(leafs)
  end

  it "absorbs the duplicate that a second team's schedule produces" do
    sync
    described_class.new(team: Team.find_by(abbreviation: "OTT"), season: season,
                        client: unthrottled_client).tap do |service|
      stub_nhl("/v1/club-schedule-season/OTT/20252026", fixture: "club_schedule_season")
      service.call
    end

    expect(Game.count).to eq(4)
  end
end
