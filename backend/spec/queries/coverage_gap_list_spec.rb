require "rails_helper"

RSpec.describe CoverageGapList do
  let(:league) { create(:league) }
  let(:season) { create(:season, league: league, nhl_season_id: 20232024) }
  let(:home) { create(:team, league: league) }
  let(:away) { create(:team, league: league) }

  def finished_game(date)
    create(:game, season: season, home_team: home, away_team: away, game_date: date,
           starts_at: date.to_time, game_type: Game::GAME_TYPES[:regular_season], state: "FINAL")
  end

  it "lists which finished games have stats and which are missing" do
    have = finished_game(Date.new(2023, 12, 20))
    missing = finished_game(Date.new(2023, 12, 23))
    create(:skater_game_stat, game: have, team: home)

    rows = described_class.new(season: season, kind: "stats").rows

    expect(rows.find { |r| r[:game_id] == have.id }[:present]).to be(true)
    expect(rows.find { |r| r[:game_id] == missing.id }[:present]).to be(false)
  end

  it "rejects an unknown kind" do
    expect { described_class.new(season: season, kind: "bogus") }.to raise_error(described_class::UnknownKind)
  end
end
