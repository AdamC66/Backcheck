require "rails_helper"

RSpec.describe AttachLogo do
  let(:team) { create(:team) }
  let(:path) { Rails.root.join("spec/fixtures/files/logos/test-logo.png") }

  it "attaches the file" do
    expect(described_class.new(team, path).call).to eq(:attached)
    expect(team.logo).to be_attached
    expect(team.logo.content_type).to eq("image/png")
  end

  it "leaves an unchanged file alone rather than replacing the blob" do
    described_class.new(team, path).call
    blob_id = team.logo.blob.id

    expect(described_class.new(team, path).call).to eq(:unchanged)
    expect(team.reload.logo.blob.id).to eq(blob_id)
    expect(ActiveStorage::Blob.count).to eq(1)
  end
end
