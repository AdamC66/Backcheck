require "rails_helper"

RSpec.describe ImportTeamAffiliations do
  let(:nhl) { create(:league, slug: "nhl", tier: 1) }
  let(:ahl) { create(:league, slug: "ahl", tier: 2) }
  let(:manifest_path) { Rails.root.join("spec/fixtures/files/teams_manifest.json") }

  def import
    described_class.new(ahl, manifest_path: manifest_path)
  end

  it "links a manifest's nhl_affiliate to that team in the newest NHL season" do
    parent = create(:team, league: nhl, abbreviation: "VAN")
    affiliate = create(:team, league: ahl, abbreviation: "ABB")
    season = create(:season, league: nhl)

    affiliations = import.call

    expect(affiliations.map(&:affiliate_team)).to eq([ affiliate ])
    expect(affiliations.first).to have_attributes(parent_team: parent, season: season)
  end

  it "reports an affiliate whose parent abbreviation doesn't resolve to an NHL team" do
    create(:season, league: nhl)
    create(:team, league: ahl, abbreviation: "ABB")

    service = import
    service.call

    expect(service.missing_teams).to eq([ "ABB" ])
  end

  it "skips without an NHL season to key affiliations to" do
    create(:team, league: nhl, abbreviation: "VAN")
    create(:team, league: ahl, abbreviation: "ABB")

    service = import

    expect(service.call).to eq([])
    expect(service.season).to be_nil
  end
end
