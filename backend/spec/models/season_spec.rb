require "rails_helper"

RSpec.describe Season, type: :model do
  it "is valid with a league, label, and dates" do
    expect(build(:season)).to be_valid
  end

  it "allows the same label in a different league" do
    create(:season, label: "2025-26")

    expect(build(:season, label: "2025-26")).to be_valid
  end

  it "rejects an end date on or before the start" do
    expect(build(:season, starts_on: Date.new(2026, 4, 16), ends_on: Date.new(2025, 10, 7)))
      .not_to be_valid
  end

  it "has no current season between seasons" do
    create(:season, starts_on: 1.year.ago.to_date, ends_on: 6.months.ago.to_date)

    expect(described_class.current).to be_empty
  end
end
