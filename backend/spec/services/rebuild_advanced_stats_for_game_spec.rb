require "rails_helper"

RSpec.describe RebuildAdvancedStatsForGame do
  let(:season) { create(:season) }
  let(:home_team) { create(:team, league: season.league) }
  let(:away_team) { create(:team, league: season.league) }
  let(:xg_model) { create(:xg_model) }
  let(:game) do
    create(:game, season: season, home_team: home_team, away_team: away_team, stats_syncing: true)
  end
  let(:player) { create(:player) }

  before do
    create(:player_game_advanced_stat, game: game, player: player, team: home_team, xg_model: xg_model)
    create(:player_game_zone_time, game: game, player: player, team: home_team)
    create(:team_game_advanced_stat, game: game, team: home_team)
    create(:team_game_advanced_stat, game: game, team: away_team)
  end

  it "rebuilds the affected player's chain and both teams' season rollups, then clears stats_syncing" do
    described_class.new(game: game).call

    expect(PlayerSeasonAdvancedStat.find_by(player: player, as_of_game: game)).to be_present
    expect(TeamSeasonAdvancedStat.find_by(team: home_team, season: season)).to be_present
    expect(TeamSeasonAdvancedStat.find_by(team: away_team, season: season)).to be_present
    expect(game.reload.stats_syncing).to be false
  end

  it "re-sums the affected player's season zone-time stint" do
    described_class.new(game: game).call

    expect(PlayerSeasonZoneTime.find_by(player: player, team: home_team, season: season, game_type: game.game_type))
      .to be_present
  end
end
