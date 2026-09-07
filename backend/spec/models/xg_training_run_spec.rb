require "rails_helper"

RSpec.describe XgTrainingRun, type: :model do
  it "is valid with a csv path, checksum, and counts" do
    expect(build(:xg_training_run)).to be_valid
  end

  it "requires a csv path" do
    expect(build(:xg_training_run, csv_path: nil)).not_to be_valid
  end

  it "names its status" do
    expect(build(:xg_training_run, status: XgTrainingRun::STATUSES[:fitted]).status_name).to eq(:fitted)
  end
end
