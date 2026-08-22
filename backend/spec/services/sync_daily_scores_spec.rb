require "rails_helper"

RSpec.describe SyncDailyScores do
  let(:league) { create(:league, slug: "nhl", abbreviation: "NHL") }
  let!(:season) { create(:season, league: league, nhl_season_id: 20252026) }

  before do
    %w[BUF DAL NYI CBJ].each { |abbrev| create(:team, league: league, abbreviation: abbrev) }
    stub_nhl("/v1/score/2026-04-15", fixture: "score")
  end

  def sync
    described_class.new(league: league, date: Date.new(2026, 4, 15), client: unthrottled_client).call
  end

  it "records the result, including how the game ended" do
    sync

    expect(Game.find_by(nhl_game_id: 2025021301)).to have_attributes(
      home_score: 3, away_score: 4, state: "OFF", last_period_type: "SO"
    )
  end

  it "reports a game it skipped for an unknown team" do
    service = described_class.new(league: league, date: Date.new(2026, 4, 15), client: unthrottled_client)
    service.call

    expect(service.missing_teams).to contain_exactly("TBL", "NYR")
    expect(Game.count).to eq(1)
  end

  it "updates a game already on the schedule instead of adding a second row" do
    existing = create(:game, season: season, nhl_game_id: 2025021301, state: "FUT",
                             home_team: Team.find_by(abbreviation: "BUF"),
                             away_team: Team.find_by(abbreviation: "DAL"),
                             home_score: nil, away_score: nil)

    sync

    expect(existing.reload).to have_attributes(state: "OFF", home_score: 3)
    expect(Game.where(nhl_game_id: 2025021301).count).to eq(1)
  end
end
