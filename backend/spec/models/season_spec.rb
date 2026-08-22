require "rails_helper"

RSpec.describe Season, type: :model do
  it "is valid when ends_on is after starts_on" do
    expect(build(:season)).to be_valid
  end

  it "rejects an end date before the start date" do
    season = build(:season, starts_on: Date.new(2026, 6, 1), ends_on: Date.new(2025, 9, 1))
    expect(season).not_to be_valid
  end
end
