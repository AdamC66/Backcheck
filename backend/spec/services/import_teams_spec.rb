require "rails_helper"

RSpec.describe ImportTeams do
  let(:league) { create(:league) }
  let(:manifest_path) { Rails.root.join("spec/fixtures/files/teams_manifest.json") }

  def import(service = described_class.new(league, manifest_path: manifest_path))
    service.tap(&:call)
  end

  it "creates a team per manifest entry, with colors and logo where the manifest has them" do
    import

    expect(league.teams.pluck(:abbreviation)).to match_array(%w[ANA ABB])
    expect(league.teams.find_by(abbreviation: "ANA")).to have_attributes(
      name: "Anaheim Ducks", primary_color: "#F47A38", tertiary_color: "#C1C6C8"
    )
    expect(league.teams.find_by(abbreviation: "ANA").logo).to be_attached
    expect(league.teams.find_by(abbreviation: "ABB").primary_color).to be_nil
  end

  it "updates matching teams on a rerun without duplicating them or their logos" do
    import
    league.teams.find_by(abbreviation: "ANA").update!(name: "Stale Name")

    import

    expect(league.teams.count).to eq(2)
    expect(league.teams.find_by(abbreviation: "ANA").name).to eq("Anaheim Ducks")
    expect(ActiveStorage::Blob.count).to eq(1)
  end
end
