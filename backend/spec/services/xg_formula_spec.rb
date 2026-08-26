require "rails_helper"

RSpec.describe XgFormula do
  it "returns 0.5 when all coefficients are zero, regardless of coordinates" do
    xg = described_class.calculate(coefficients: { intercept: 0, distance: 0, angle: 0 }, x_coord: 70, y_coord: 10)

    expect(xg).to eq(0.5)
  end

  it "returns 0.0 when coordinates are missing" do
    xg = described_class.calculate(coefficients: { intercept: 0, distance: 0, angle: 0 }, x_coord: nil, y_coord: nil)

    expect(xg).to eq(0.0)
  end

  it "scores a shot closer to the net higher than one farther away, all else equal" do
    coefficients = { intercept: 0, distance: -0.1, angle: 0 }

    close = described_class.calculate(coefficients: coefficients, x_coord: 85, y_coord: 0)
    far = described_class.calculate(coefficients: coefficients, x_coord: 30, y_coord: 0)

    expect(close).to be > far
  end
end
