require "rails_helper"

RSpec.describe ComputeIndividualGameStats do
  let(:season) { create(:season) }
  let(:home_team) { create(:team, league: season.league) }
  let(:away_team) { create(:team, league: season.league) }
  let(:game) { create(:game, season: season, home_team: home_team, away_team: away_team) }
  let(:winner) { create(:player) }
  let(:loser) { create(:player) }

  before do
    create(:shift, game: game, team: home_team, player: winner)
    create(:shift, game: game, team: away_team, player: loser)
  end

  it "credits a faceoff's winner/loser, and a shooter's attempted/missed/blocked shots" do
    create(:game_event, game: game, team: home_team, event_type: GameEvent::EVENT_TYPES[:faceoff],
          primary_player: winner, secondary_player: loser)
    create(:game_event, game: game, team: home_team, event_type: GameEvent::EVENT_TYPES[:shot],
          primary_player: winner)
    create(:game_event, game: game, team: home_team, event_type: GameEvent::EVENT_TYPES[:missed_shot],
          primary_player: winner)
    create(:game_event, game: game, team: away_team, event_type: GameEvent::EVENT_TYPES[:blocked_shot],
          primary_player: loser)

    described_class.new(game: game, recompute: :skip).call

    expect(SkaterGameStat.find_by(game: game, player: winner))
      .to have_attributes(faceoff_wins: 1, faceoff_losses: 0, shots_attempted: 2, missed_shots: 1,
                          shots_blocked_against: 0)
    expect(SkaterGameStat.find_by(game: game, player: loser))
      .to have_attributes(faceoff_wins: 0, faceoff_losses: 1, shots_attempted: 1, missed_shots: 0,
                          shots_blocked_against: 1)
  end

  it "creates the row (with a team) when the box score hasn't synced this game yet" do
    create(:game_event, game: game, team: home_team, event_type: GameEvent::EVENT_TYPES[:shot], primary_player: winner)

    described_class.new(game: game, recompute: :skip).call

    expect(SkaterGameStat.find_by(game: game, player: winner)).to have_attributes(team: home_team, shots_attempted: 1)
  end

  # Regression guard for TASK-105: shift charts only ever cover skaters, so a goalie
  # crediting a shot (an empty-net attempt) has no shift row to look their team up
  # from — the event's own team_id has to be the source, not a shift lookup.
  it "resolves a goalie's team from the event itself, since goalies have no shifts" do
    goalie = create(:player, position: Player::POSITIONS[:goalie])
    create(:game_event, game: game, team: home_team, event_type: GameEvent::EVENT_TYPES[:shot], primary_player: goalie)

    described_class.new(game: game, recompute: :skip).call

    expect(SkaterGameStat.find_by(game: game, player: goalie)).to have_attributes(team: home_team, shots_attempted: 1)
  end

  # Regression guard for TASK-105: a faceoff's own team_id is the winner's — the
  # loser's team has to be derived (whichever of the game's two teams isn't that),
  # and a faceoff loser can just as easily have no shift row as a shooter can.
  it "resolves a faceoff loser's team as the other of the game's two teams" do
    goalie = create(:player, position: Player::POSITIONS[:goalie])
    create(:game_event, game: game, team: home_team, event_type: GameEvent::EVENT_TYPES[:faceoff],
          primary_player: winner, secondary_player: goalie)

    described_class.new(game: game, recompute: :skip).call

    expect(SkaterGameStat.find_by(game: game, player: goalie)).to have_attributes(team: away_team, faceoff_losses: 1)
  end

  # Regression guard for TASK-102/104's established pattern: a bulk sync defers the
  # season-stat rollup to its own batch instead of recomputing once per game.
  it "defers the season-stat rollup when recompute: :skip, but still returns the touched rows" do
    create(:game_event, game: game, team: home_team, event_type: GameEvent::EVENT_TYPES[:shot], primary_player: winner)

    result = described_class.new(game: game, recompute: :skip).call

    expect(SkaterSeasonStat.where(player: winner, season: season)).to be_none
    expect(result.map(&:player)).to include(winner)
  end
end
