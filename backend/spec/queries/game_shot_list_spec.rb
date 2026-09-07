require "rails_helper"

RSpec.describe GameShotList do
  let(:game) { create(:game) }

  before { create(:xg_model, active: true, coefficients: { intercept: 0, distance: 0, angle: 0 }) }

  it "places both teams on a home-attacks-+x frame with per-shot xG" do
    create(:game_event, game: game, team: game.home_team, event_type: GameEvent::EVENT_TYPES[:goal],
           x_coord: 80, y_coord: 5)
    create(:game_event, game: game, team: game.away_team, x_coord: -75, y_coord: -3)

    shots = described_class.new(game: game).shots

    home = shots.find { |shot| shot.team_side == :home }
    away = shots.find { |shot| shot.team_side == :away }
    expect(home).to have_attributes(x: 80, y: 5, is_goal: true)
    expect(away).to have_attributes(x: -75, y: -3, is_goal: false)
    expect(home.xg).to eq(0.5)
  end

  it "mirrors the sheet when the home team defends the right side" do
    create(:game_event, game: game, team: game.home_team, x_coord: -80, y_coord: 5,
           home_team_defending_side: GameEvent::DEFENDING_SIDES[:right])

    shot = described_class.new(game: game).shots.first

    expect(shot).to have_attributes(x: 80, y: -5, team_side: :home)
  end

  it "excludes a regular-season shootout attempt and counts coordinate-less shots" do
    create(:game_event, game: game, team: game.home_team, period: 5, period_time_seconds: 0)
    create(:game_event, game: game, team: game.home_team, x_coord: nil, y_coord: nil)
    create(:game_event, game: game, team: game.home_team, x_coord: 70, y_coord: 0)

    list = described_class.new(game: game)

    expect(list.shots.size).to eq(1)
    expect(list.unlocated_count).to eq(1)
  end

  it "raises without an active xg_model" do
    XgModel.update_all(active: false)

    expect { described_class.new(game: game) }.to raise_error(ArgumentError, /active xg_model/)
  end
end
