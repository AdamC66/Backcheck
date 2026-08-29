require "rails_helper"

RSpec.describe RebuildTouchedAdvancedStatsChains do
  let(:season) { create(:season) }
  let(:team) { create(:team, league: season.league) }
  let(:opponent) { create(:team, league: season.league) }
  let(:xg_model) { create(:xg_model) }
  let(:player) { create(:player) }

  def batch
    described_class.new(season: season)
  end

  it "rebuilds a touched player's full season chain from one game tracked at a time" do
    game1 = create(:game, season: season, home_team: team, away_team: opponent, starts_at: Time.utc(2025, 10, 1))
    game2 = create(:game, season: season, home_team: team, away_team: opponent, starts_at: Time.utc(2025, 10, 5))
    create(:player_game_advanced_stat, game: game1, player: player, team: team, xg_model: xg_model, corsi_for: 10)
    create(:player_game_advanced_stat, game: game2, player: player, team: team, xg_model: xg_model, corsi_for: 15)

    b = batch
    b.track(game1)
    b.track(game2)
    b.call

    final = PlayerSeasonAdvancedStat.find_by(player: player, as_of_game: game2)
    expect(final).to have_attributes(games_played: 2, corsi_for: 25)
  end

  # Regression guard for TASK-94: a dimension that only first appears partway
  # through the games this run touched (not the player's very first game) still
  # needs its own chain built — anchoring every dimension at the earliest game
  # this run happened to see first would silently drop it.
  it "builds every dimension's chain, even one that first appears in a later tracked game" do
    game1 = create(:game, season: season, home_team: team, away_team: opponent, starts_at: Time.utc(2025, 10, 1))
    game2 = create(:game, season: season, home_team: team, away_team: opponent, starts_at: Time.utc(2025, 10, 5))
    create(:player_game_advanced_stat, game: game1, player: player, team: team, xg_model: xg_model,
           strength_state: PlayerGameAdvancedStat::STRENGTH_STATES[:five_v_five], corsi_for: 10)
    create(:player_game_advanced_stat, game: game2, player: player, team: team, xg_model: xg_model,
           strength_state: PlayerGameAdvancedStat::STRENGTH_STATES[:power_play], corsi_for: 4)

    b = batch
    b.track(game1)
    b.track(game2)
    b.call

    five_v_five = PlayerSeasonAdvancedStat.find_by(player: player,
                                                   strength_state: PlayerGameAdvancedStat::STRENGTH_STATES[:five_v_five])
    power_play = PlayerSeasonAdvancedStat.find_by(player: player,
                                                  strength_state: PlayerGameAdvancedStat::STRENGTH_STATES[:power_play])
    expect(five_v_five).to have_attributes(games_played: 1, corsi_for: 10)
    expect(power_play).to have_attributes(games_played: 1, corsi_for: 4)
  end

  it "rebuilds every distinct touched team's season rollup too" do
    game = create(:game, season: season, home_team: team, away_team: opponent, starts_at: Time.utc(2025, 10, 1))
    create(:team_game_advanced_stat, game: game, team: team, corsi_for: 50)
    create(:team_game_advanced_stat, game: game, team: opponent, corsi_for: 40)

    batch.tap { |b| b.track(game) }.call

    expect(TeamSeasonAdvancedStat.find_by(team: team, season: season)).to have_attributes(games_played: 1, corsi_for: 50)
    expect(TeamSeasonAdvancedStat.find_by(team: opponent, season: season)).to have_attributes(games_played: 1, corsi_for: 40)
  end

  it "clears stats_syncing on every tracked game once the rebuild completes" do
    game = create(:game, season: season, home_team: team, away_team: opponent, starts_at: Time.utc(2025, 10, 1),
                  stats_syncing: true)
    create(:player_game_advanced_stat, game: game, player: player, team: team, xg_model: xg_model)

    batch.tap { |b| b.track(game) }.call

    expect(game.reload.stats_syncing).to be false
  end

  # Regression guard for TASK-104: one bad player's chain used to abort the whole
  # batch uncaught, leaving stats_syncing stuck true instead of getting cleared.
  it "keeps rebuilding the rest when one player raises, and records the failure" do
    other_player = create(:player)
    game = create(:game, season: season, home_team: team, away_team: opponent, starts_at: Time.utc(2025, 10, 1),
                  stats_syncing: true)
    create(:player_game_advanced_stat, game: game, player: player, team: team, xg_model: xg_model)
    create(:player_game_advanced_stat, game: game, player: other_player, team: team, xg_model: xg_model)
    allow(RebuildPlayerAdvancedStatsChain).to receive(:new).and_call_original
    allow(RebuildPlayerAdvancedStatsChain).to receive(:new).with(hash_including(player: player)).and_raise("boom")

    b = batch
    b.track(game)
    b.call

    expect(PlayerSeasonAdvancedStat.find_by(player: other_player)).to be_present
    expect(PlayerSeasonAdvancedStat.find_by(player: player)).to be_nil
    expect(b.failures).to eq([ "player=#{player.id}: boom" ])
    expect(game.reload.stats_syncing).to be false
  end
end
