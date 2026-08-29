require "rails_helper"

RSpec.describe RecomputeTouchedSeasonStats do
  let(:season) { create(:season) }
  let(:team) { create(:team, league: season.league) }
  let(:player) { create(:player) }

  it "recomputes every distinct (player, team, game_type) combo it was tracked with" do
    other_team = create(:team, league: season.league)
    other_player = create(:player)
    game = create(:game, season: season, home_team: team, away_team: other_team)
    stat = create(:skater_game_stat, player: player, game: game, team: team, goals: 2, assists: 1)
    other_stat = create(:skater_game_stat, player: other_player, game: game, team: other_team)

    batch = described_class.new(season: season)
    batch.track(stat, game.game_type)
    batch.track(other_stat, game.game_type)
    batch.call

    expect(SkaterSeasonStat.find_by(player: player, team: team, season: season))
      .to have_attributes(games_played: 1, goals: 2, assists: 1)
    expect(SkaterSeasonStat.find_by(player: other_player, team: other_team, season: season)).to be_present
  end

  # Regression guard: the whole point of batching is one recompute per distinct
  # combo, not one per tracked stat row.
  it "recomputes a combo only once no matter how many times it's tracked" do
    game = create(:game, season: season, home_team: team)
    stat = create(:skater_game_stat, player: player, game: game, team: team)
    batch = described_class.new(season: season)
    batch.track(stat, game.game_type)
    batch.track(stat, game.game_type)

    expect(RecomputeSeasonStats).to receive(:new).once.and_call_original

    batch.call
  end

  # Regression guard for TASK-104: one bad combo must not abort the whole batch.
  it "keeps recomputing the rest when one combo raises, and records the failure" do
    other_team = create(:team, league: season.league)
    other_player = create(:player)
    game = create(:game, season: season, home_team: team, away_team: other_team)
    stat = create(:skater_game_stat, player: player, game: game, team: team)
    other_stat = create(:skater_game_stat, player: other_player, game: game, team: other_team)
    batch = described_class.new(season: season)
    batch.track(stat, game.game_type)
    batch.track(other_stat, game.game_type)
    allow(RecomputeSeasonStats).to receive(:new).and_call_original
    allow(RecomputeSeasonStats).to receive(:new).with(hash_including(player: player)).and_raise("boom")

    batch.call

    expect(SkaterSeasonStat.find_by(player: other_player, team: other_team, season: season)).to be_present
    expect(SkaterSeasonStat.find_by(player: player, team: team, season: season)).to be_nil
    expect(batch.failures.size).to eq(1)
    expect(batch.failures.first).to include("player=#{player.id}", "boom")
  end
end
