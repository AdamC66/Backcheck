require "rails_helper"

RSpec.describe RebuildPlayerAdvancedStatsChain do
  let(:season) { create(:season) }
  let(:team_a) { create(:team, league: season.league) }
  let(:team_b) { create(:team, league: season.league) }
  let(:opponent) { create(:team, league: season.league) }
  let(:xg_model) { create(:xg_model) }
  let(:player) { create(:player) }

  let(:game1) do
    create(:game, season: season, home_team: team_a, away_team: opponent, starts_at: Time.utc(2025, 10, 1))
  end
  let(:game2) do
    create(:game, season: season, home_team: team_b, away_team: opponent, starts_at: Time.utc(2025, 10, 5))
  end
  let(:game3) do
    create(:game, season: season, home_team: team_a, away_team: opponent, starts_at: Time.utc(2025, 10, 10))
  end

  before do
    create(:player_game_advanced_stat, game: game1, player: player, team: team_a, xg_model: xg_model, corsi_for: 10)
    create(:player_game_advanced_stat, game: game2, player: player, team: team_b, xg_model: xg_model, corsi_for: 10)
    create(:player_game_advanced_stat, game: game3, player: player, team: team_a, xg_model: xg_model, corsi_for: 10)
  end

  def rebuild_from(game)
    described_class.new(player: player, from_game: game).call
  end

  it "chains each snapshot off the prior game's totals plus the new game's delta, in actual game order" do
    rebuild_from(game1)

    snapshots = PlayerSeasonAdvancedStat.where(player: player).joins(:as_of_game).order("games.starts_at")
    expect(snapshots.map(&:games_played)).to eq([ 1, 2, 3 ])
    expect(snapshots.map(&:corsi_for)).to eq([ 10, 20, 30 ])
    expect(snapshots.map(&:team)).to eq([ team_a, team_b, team_a ])
  end

  it "rebuilding forward from a mid-chain correction matches a full from-scratch recompute" do
    rebuild_from(game1)

    rebuild_from(game2)

    final = PlayerSeasonAdvancedStat.find_by(player: player, as_of_game: game3)
    expect(final).to have_attributes(games_played: 3, corsi_for: 30)
  end

  it "is safe to re-run: repeating the rebuild never double-counts a game's delta" do
    rebuild_from(game1)
    rebuild_from(game2)
    rebuild_from(game2)

    final = PlayerSeasonAdvancedStat.find_by(player: player, as_of_game: game3)
    expect(final).to have_attributes(games_played: 3, corsi_for: 30)
    expect(PlayerSeasonAdvancedStat.where(player: player).count).to eq(3)
  end

  it "never mixes a playoff correction into the regular-season chain, or vice versa" do
    rebuild_from(game1)
    rebuild_from(game2)
    rebuild_from(game3)

    playoff_game = create(:game, season: season, home_team: team_a, away_team: opponent,
                          game_type: Game::GAME_TYPES[:playoffs], starts_at: Time.utc(2025, 10, 15))
    create(:player_game_advanced_stat, game: playoff_game, player: player, team: team_a, xg_model: xg_model,
           corsi_for: 99)

    rebuild_from(playoff_game)

    playoff_snapshot = PlayerSeasonAdvancedStat.find_by(player: player, as_of_game: playoff_game)
    expect(playoff_snapshot).to have_attributes(games_played: 1, corsi_for: 99,
                                                game_type: Game::GAME_TYPES[:playoffs])

    regular_season_final = PlayerSeasonAdvancedStat.find_by(player: player, as_of_game: game3)
    expect(regular_season_final).to have_attributes(games_played: 3, corsi_for: 30)
  end

  # Regression guard for TASK-93: backfilling an older season after a newer one is
  # already ingested (the same player has rows in both) used to pull the newer
  # season's games into the chain via a from_game.game_type-only filter, then fail
  # PlayerSeasonAdvancedStat's season/as_of_game validation trying to save them.
  it "never mixes another season's games into the chain, even sharing the same game_type" do
    later_season = create(:season, league: season.league, starts_on: season.ends_on + 1.day,
                          ends_on: season.ends_on + 200.days)
    later_game = create(:game, season: later_season, home_team: team_a, away_team: opponent,
                        starts_at: season.ends_on + 10.days)
    create(:player_game_advanced_stat, game: later_game, player: player, team: team_a, xg_model: xg_model,
           corsi_for: 5)

    expect { rebuild_from(game1) }.not_to raise_error

    expect(PlayerSeasonAdvancedStat.where(player: player, season: season).count).to eq(3)
    expect(PlayerSeasonAdvancedStat.where(player: player, season: later_season)).to be_none
  end
end
