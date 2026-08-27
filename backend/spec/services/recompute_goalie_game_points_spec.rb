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
end
