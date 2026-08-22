require "rails_helper"

RSpec.describe SyncStandings do
  let(:league) { create(:league, slug: "nhl", abbreviation: "NHL") }
  let(:date) { Date.new(2026, 4, 17) }
  let!(:season) { create(:season, league: league, nhl_season_id: 20252026) }
  let!(:avalanche) { create(:team, league: league, abbreviation: "COL", name: "Colorado Avalanche") }

  before { stub_nhl("/v1/standings/2026-04-17", fixture: "standings") }

  def sync
    described_class.new(league: league, date: date, client: unthrottled_client)
  end

  it "writes a dated snapshot per team" do
    sync.call

    standing = TeamStanding.find_by(team: avalanche, season: season)
    expect(standing).to have_attributes(
      as_of_date: date, games_played: 82, wins: 55, points: 121,
      goals_for: 302, goals_against: 203, league_sequence: 1, streak_code: "W"
    )
  end

  it "resolves an abbreviation shared with another league to the right team" do
    ahl = create(:league, slug: "ahl", abbreviation: "AHL", tier: 2)
    wranglers = create(:team, league: ahl, abbreviation: "CGY", name: "Calgary Wranglers")
    flames = create(:team, league: league, abbreviation: "CGY", name: "Calgary Flames")

    sync.call

    expect(TeamStanding.where(team: wranglers)).to be_empty
    expect(TeamStanding.where(team: flames).count).to eq(1)
  end

  it "reports teams it could not match instead of failing the run" do
    service = sync
    service.call

    expect(service.missing_teams).to contain_exactly("CGY", "TOR")
    expect(TeamStanding.count).to eq(1)
  end

  it "updates the same snapshot on a rerun" do
    sync.call
    sync.call

    expect(TeamStanding.count).to eq(1)
  end

  it "refuses to guess when the season hasn't been imported" do
    season.destroy!

    expect { sync.call }.to raise_error(described_class::UnknownSeason)
  end
end
