require "rails_helper"

RSpec.describe ShotGeometry do
  it "computes distance and angle relative to the target net" do
    geometry = described_class.new(x_coord: 75, y_coord: 0, target_net_x: 89)

    expect(geometry.distance).to be_within(0.001).of(14)
    expect(geometry.angle).to eq(0)
  end

  it "folds coordinates onto the +x net, so a shot scores identically at either end" do
    right = described_class.new(x_coord: 75, y_coord: 5, target_net_x: 89)
    left = described_class.new(x_coord: -75, y_coord: -5, target_net_x: -89)

    expect(left.offensive_x).to eq(75)
    expect(left.offensive_y).to eq(5)
    expect(left.distance).to be_within(0.001).of(right.distance)
  end

  it "is not present, and returns nil for every measure, when a coordinate is missing" do
    geometry = described_class.new(x_coord: nil, y_coord: 5, target_net_x: 89)

    expect(geometry.present?).to be(false)
    expect(geometry.distance).to be_nil
    expect(geometry.offensive_x).to be_nil
  end
end
