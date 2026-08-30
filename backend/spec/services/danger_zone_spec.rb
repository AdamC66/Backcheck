require "rails_helper"

RSpec.describe DangerZone do
  describe ".classify" do
    it "puts a shot from the slot in the high-danger bucket" do
      expect(described_class.classify(x_coord: 80, y_coord: 0, target_net_x: 89)).to eq(:high_danger)
    end

    it "puts a sharp-angle shot ~7ft from the net (outside the polygon) in high-danger via the crease radius" do
      expect(described_class.classify(x_coord: 88, y_coord: -7, target_net_x: 89)).to eq(:high_danger)
    end

    it "puts a shot just outside the slot but still in range in mid-range" do
      expect(described_class.classify(x_coord: 50, y_coord: 10, target_net_x: 89)).to eq(:mid_range)
    end

    it "puts a point shot in the long-range bucket" do
      expect(described_class.classify(x_coord: 30, y_coord: 20, target_net_x: 89)).to eq(:long_range)
    end

    it "classifies a shot the same regardless of which end the net is on" do
      right = described_class.classify(x_coord: 30, y_coord: 20, target_net_x: 89)
      left = described_class.classify(x_coord: -30, y_coord: -20, target_net_x: -89)

      expect(left).to eq(right)
    end

    it "returns nil for a shot with no coordinates" do
      expect(described_class.classify(x_coord: nil, y_coord: nil, target_net_x: 89)).to be_nil
    end
  end
end
