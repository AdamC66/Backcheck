require "rails_helper"

RSpec.describe XgModel, type: :model do
  it "is valid with a version, coefficients, and a trained_at" do
    expect(build(:xg_model)).to be_valid
  end

  it "rejects a duplicate version" do
    existing = create(:xg_model)

    expect(build(:xg_model, version: existing.version)).not_to be_valid
  end

  it "enforces at most one active row, even past the model validation layer" do
    create(:xg_model, active: true)

    expect {
      build(:xg_model, active: true).save(validate: false)
    }.to raise_error(ActiveRecord::RecordNotUnique)
  end

  describe ".activate!" do
    it "deactivates the previous active version and activates the new one" do
      old = create(:xg_model, active: true)
      new_version = create(:xg_model, active: false)

      XgModel.activate!(new_version.version)

      expect(old.reload.active).to be false
      expect(new_version.reload.active).to be true
      expect(XgModel.active).to eq(new_version)
    end
  end
end
