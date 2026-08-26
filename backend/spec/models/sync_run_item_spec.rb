require "rails_helper"

RSpec.describe SyncRunItem, type: :model do
  it "is valid with a sync run and a known kind" do
    expect(build(:sync_run_item)).to be_valid
  end

  it "rejects a status outside the known set" do
    item = build(:sync_run_item, status: 999)

    expect(item).not_to be_valid
    expect(item.errors[:status]).to be_present
  end
end
