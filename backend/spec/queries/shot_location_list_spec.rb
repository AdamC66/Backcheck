require "rails_helper"

RSpec.describe ShotLocationList do
  let(:game) { create(:game) }
  let(:team) { game.home_team }

  it "returns located home-team shots, normalized and danger-classified" do
    create(:game_event, game: game, team: team, x_coord: 62, y_coord: -12,
           home_team_defending_side: GameEvent::DEFENDING_SIDES[:left])

    shots = described_class.new(games: [ game ], team: team).shots

    expect(shots.size).to eq(1)
    expect(shots.first).to have_attributes(offensive_x: 62, offensive_y: -12, danger_zone: :high_danger)
  end

  it "counts a coordinate-less shot instead of dropping it" do
    create(:game_event, game: game, team: team, x_coord: 62, y_coord: -12)
    create(:game_event, game: game, team: team, x_coord: nil, y_coord: nil)

    list = described_class.new(games: [ game ], team: team)

    expect(list.shots.size).to eq(1)
    expect(list.unlocated_count).to eq(1)
  end

  it "filters to a strength state" do
    create(:game_event, game: game, team: team, strength_state: GameEvent::STRENGTH_STATES[:even_strength])
    create(:game_event, game: game, team: team, strength_state: GameEvent::STRENGTH_STATES[:power_play])

    shots = described_class.new(games: [ game ], team: team,
                                strength_state: described_class::STRENGTH_STATES[:power_play]).shots

    expect(shots.map(&:strength_state)).to eq([ :power_play ])
  end

  it "excludes shots taken while the game was not close when score_state is close" do
    create(:game_event, game: game, team: team, event_type: GameEvent::EVENT_TYPES[:goal],
           x_coord: nil, y_coord: nil, period: 1, period_time_seconds: 100)
    create(:game_event, game: game, team: team, event_type: GameEvent::EVENT_TYPES[:goal],
           x_coord: nil, y_coord: nil, period: 1, period_time_seconds: 200)
    create(:game_event, game: game, team: team, x_coord: 62, y_coord: -12, period: 2, period_time_seconds: 300)

    list = described_class.new(games: [ game ], team: team, score_state: described_class::SCORE_STATES[:close])

    expect(list.shots).to be_empty
  end
end
