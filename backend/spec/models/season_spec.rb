require "rails_helper"

RSpec.describe Season, type: :model do
  it "is valid with a league, label, and dates" do
    expect(build(:season)).to be_valid
  end

  it "has no current season between seasons" do
    create(:season, starts_on: 1.year.ago.to_date, ends_on: 6.months.ago.to_date)

    expect(described_class.current).to be_empty
  end

  describe ".overlapping" do
    it "matches a season whose calendar range overlaps the reference, regardless of exact dates" do
      other_league = create(:league)
      reference = create(:season, starts_on: Date.new(2025, 10, 7), ends_on: Date.new(2026, 4, 16))
      overlapping = create(:season, league: other_league, starts_on: Date.new(2025, 10, 1),
                                    ends_on: Date.new(2026, 6, 1))
      create(:season, league: other_league, starts_on: Date.new(2026, 10, 1), ends_on: Date.new(2027, 4, 1))

      expect(other_league.seasons.overlapping(reference)).to contain_exactly(overlapping)
    end
  end
end
