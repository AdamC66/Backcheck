require "rails_helper"

RSpec.describe ShotFeatures do
  let(:game) { create(:game) }

  def event(**overrides)
    create(:game_event, game: game, team: game.home_team,
           event_type: GameEvent::EVENT_TYPES[:shot], home_team_defending_side: "left", **overrides)
  end

  it "exposes the shot's distance, angle, danger zone, shot type and strength state" do
    features = described_class.new(event: event(x_coord: 84, y_coord: 2,
                                               shot_type: GameEvent::SHOT_TYPES[:slap],
                                               strength_state: GameEvent::STRENGTH_STATES[:power_play]))

    expect(features).to be_present
    expect(features.distance).to be_within(0.1).of(5.4)
    expect(features.danger_zone).to eq(:high_danger)
    expect(features.shot_type_name).to eq("slap")
    expect(features.strength_state_name).to eq("power_play")
  end

  it "is not present, and names an absent shot/strength type 'unknown'" do
    features = described_class.new(event: event(x_coord: nil, y_coord: nil, shot_type: nil, strength_state: nil))

    expect(features).not_to be_present
    expect(features.shot_type_name).to eq("unknown")
    expect(features.strength_state_name).to eq("unknown")
  end
end
