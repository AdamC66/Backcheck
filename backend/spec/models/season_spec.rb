require "rails_helper"

RSpec.describe Season, type: :model do
  it "is valid with a league, label, and dates" do
    expect(build(:season)).to be_valid
  end

  it "has no current season between seasons" do
    create(:season, starts_on: 1.year.ago.to_date, ends_on: 6.months.ago.to_date)

    expect(described_class.current).to be_empty
  end
end
