require "rails_helper"

RSpec.describe LeagueCoverageMatrix do
  let(:league) { create(:league) }
  let(:season) { create(:season, league: league, nhl_season_id: 20232024) }
  let(:home) { create(:team, league: league) }
  let(:away) { create(:team, league: league) }

  def finished_game
    create(:game, season: season, home_team: home, away_team: away,
           game_type: Game::GAME_TYPES[:regular_season], state: "FINAL")
  end

  it "reports synced vs total per kind from the data tables, not from sync runs" do
    games = Array.new(3) { finished_game }
    create(:skater_game_stat, game: games.first, team: home)
    create(:player_game_advanced_stat, game: games.first, team: home)
    create(:roster_spot, season: season, team: home)
    [ home, away ].each do |team|
      create(:team_standing, season: season, team: team, games_played: 4, as_of_date: Date.new(2024, 4, 18))
    end

    row = described_class.new(league: league).rows.find { |r| r.season_id == season.id }

    expect(row.games).to have_attributes(synced: 3, total: 4)
    expect(row.stats).to have_attributes(synced: 1, total: 3)
    expect(row.advanced).to have_attributes(synced: 1, total: 3)
    expect(row.roster).to have_attributes(synced: 1, total: 2)
  end

  it "counts stale season advanced-stat rows for the cell even when every game has data" do
    game = finished_game
    create(:player_game_advanced_stat, game: game, team: home)
    create(:player_season_advanced_stat, season: season, as_of_game: game, team: home, stale: true)

    row = described_class.new(league: league).rows.find { |r| r.season_id == season.id }

    expect(row.advanced.stale).to eq(1)
  end

  it "marks NHL-only kinds not applicable for a league with no nhl_season_id" do
    other = create(:season, league: league, nhl_season_id: nil)
    create(:roster_spot, season: other, team: home)

    row = described_class.new(league: league).rows.find { |r| r.season_id == other.id }

    expect(row.stats.synced).to be_nil
    expect(row.games.synced).to be_nil
    expect(row.roster.synced).to eq(1)
  end
end
