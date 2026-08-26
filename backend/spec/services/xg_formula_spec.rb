require "rails_helper"

RSpec.describe XgFormula do
  it "returns 0.5 when all coefficients are zero, regardless of coordinates" do
    xg = described_class.calculate(coefficients: { intercept: 0, distance: 0, angle: 0 }, x_coord: 70, y_coord: 10,
                                    target_net_x: 89)

    expect(xg).to eq(0.5)
  end

  it "returns 0.0 when coordinates or the target net are missing" do
    coefficients = { intercept: 0, distance: 0, angle: 0 }

    expect(described_class.calculate(coefficients: coefficients, x_coord: nil, y_coord: nil,
                                     target_net_x: 89)).to eq(0.0)
    expect(described_class.calculate(coefficients: coefficients, x_coord: 70, y_coord: 10,
                                     target_net_x: nil)).to eq(0.0)
  end

  it "scores a shot closer to the target net higher than one farther away, all else equal" do
    coefficients = { intercept: 0, distance: -0.1, angle: 0 }

    close = described_class.calculate(coefficients: coefficients, x_coord: 85, y_coord: 0, target_net_x: 89)
    far = described_class.calculate(coefficients: coefficients, x_coord: 30, y_coord: 0, target_net_x: 89)

    expect(close).to be > far
  end

  it "scores the same physical shot identically whether the target net is on the left or right" do
    coefficients = { intercept: 0, distance: -0.05, angle: -0.02 }

    left_target = described_class.calculate(coefficients: coefficients, x_coord: 70, y_coord: 10, target_net_x: 89)
    right_target = described_class.calculate(coefficients: coefficients, x_coord: -70, y_coord: 10,
                                              target_net_x: -89)

    expect(left_target).to eq(right_target)
  end
end
