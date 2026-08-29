require "rails_helper"

RSpec.describe RecomputeGoalieGamePoints do
  it "backfills an existing GoalieGameStat's goals/assists from game_events, and the season rollup with it" do
    season = create(:season)
    team = create(:team, league: season.league)
    game = create(:game, season: season, home_team: team)
    goalie = create(:player, position: Player::POSITIONS[:goalie])
    stat = create(:goalie_game_stat, player: goalie, game: game, team: team, goals: 0, assists: 0)
    create(:game_event, game: game, team: team, event_type: GameEvent::EVENT_TYPES[:goal], primary_player: goalie)

    described_class.new(game: game).call

    expect(stat.reload).to have_attributes(goals: 1, assists: 0)
    expect(GoalieSeasonStat.find_by(player: goalie, team: team, season: season))
      .to have_attributes(goals: 1, games_played: 1)
  end

  it "does nothing when game_stats hasn't synced this game yet" do
    game = create(:game)
    create(:game_event, game: game, event_type: GameEvent::EVENT_TYPES[:goal])

    expect { described_class.new(game: game).call }.not_to change(GoalieGameStat, :count)
  end

  # Regression guard for TASK-102: a bulk sync defers the season-stat recompute to its
  # own batch instead of doing it per game, same reasoning as TASK-88/93 — but the
  # goalie's own goals/assists still update immediately either way, and the touched
  # GoalieGameStat rows are always returned so the caller can batch them itself.
  it "still updates goals/assists but defers the season rollup when recompute: :skip" do
    season = create(:season)
    team = create(:team, league: season.league)
    game = create(:game, season: season, home_team: team)
    goalie = create(:player, position: Player::POSITIONS[:goalie])
    stat = create(:goalie_game_stat, player: goalie, game: game, team: team, goals: 0, assists: 0)
    create(:game_event, game: game, team: team, event_type: GameEvent::EVENT_TYPES[:goal], primary_player: goalie)

    result = described_class.new(game: game, recompute: :skip).call

    expect(stat.reload).to have_attributes(goals: 1, assists: 0)
    expect(GoalieSeasonStat.find_by(player: goalie, team: team, season: season)).to be_nil
    expect(result).to eq([ stat ])
  end
end
