require "rails_helper"

RSpec.describe XgFormula do
  let(:game) { create(:game) }

  def shot(x:, y:, defending_side: "left", team: nil, shot_type: :wrist, strength: :even_strength)
    create(:game_event, game: game, team: team || game.home_team,
           event_type: GameEvent::EVENT_TYPES[:shot], x_coord: x, y_coord: y,
           home_team_defending_side: defending_side,
           shot_type: GameEvent::SHOT_TYPES[shot_type],
           strength_state: GameEvent::STRENGTH_STATES[strength])
  end

  it "returns 0.5 when every coefficient is zero" do
    xg = described_class.calculate(coefficients: { intercept: 0 }, event: shot(x: 70, y: 10))

    expect(xg).to eq(0.5)
  end

  it "returns 0.0 when the shot has no usable coordinates" do
    xg = described_class.calculate(coefficients: { intercept: 0 }, event: shot(x: nil, y: nil))

    expect(xg).to eq(0.0)
  end

  it "ignores feature terms the coefficient set does not carry (v0-placeholder path)" do
    v0 = { intercept: 0.2, distance: -0.05, angle: -0.02 }
    event = shot(x: 70, y: 10, shot_type: :slap, strength: :power_play)

    slap_pp = described_class.calculate(coefficients: v0, event: event)
    plain = described_class.calculate(coefficients: v0, event: shot(x: 70, y: 10))

    expect(slap_pp).to eq(plain)
  end

  it "applies shot_type, strength_state, danger-zone and rebound terms when present" do
    coefficients = {
      intercept: -1.5, distance: -0.03, angle: -0.6, rebound: 0.4,
      shot_type_slap: 0.2, strength_state_power_play: 0.3, danger_zone_high_danger: 0.25
    }
    event = shot(x: 84, y: 2, shot_type: :slap, strength: :power_play)

    with_rebound = described_class.calculate(coefficients: coefficients, event: event, rebound: true)
    without = described_class.calculate(coefficients: coefficients, event: event, rebound: false)

    expect(with_rebound).to be > without
  end

  it "scores the same physical shot identically regardless of which end the team defends" do
    coefficients = {
      intercept: -1.5, distance: -0.03, angle: -0.6, rebound: 0.4,
      shot_type_slap: 0.2, strength_state_power_play: 0.3,
      danger_zone_high_danger: 0.25, danger_zone_mid_range: -0.4
    }

    left = shot(x: 70, y: 10, defending_side: "left", team: game.home_team,
                shot_type: :slap, strength: :power_play)
    right = shot(x: -70, y: -10, defending_side: "right", team: game.home_team,
                 shot_type: :slap, strength: :power_play)

    expect(described_class.calculate(coefficients: coefficients, event: left, rebound: true))
      .to eq(described_class.calculate(coefficients: coefficients, event: right, rebound: true))
  end
end
