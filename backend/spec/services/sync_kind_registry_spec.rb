require "rails_helper"

RSpec.describe SyncKindRegistry do
  it "has a definition for every kind SyncRun knows about" do
    SyncRun::SYNC_KINDS.each_key do |kind|
      expect(described_class::DEFINITIONS).to have_key(kind)
    end
  end

  it "requires a team but no league/date for team_roster" do
    expect(described_class.scope_axes(:team_roster)).to eq([ :team ])
  end

  it "requires league and date but no team for standings" do
    expect(described_class.scope_axes(:standings)).to eq([ :league, :date ])
  end

  it "requires team and season for advanced_stats, same as game_stats" do
    expect(described_class.scope_axes(:advanced_stats)).to eq([ :team, :season ])
  end

  it "requires team and season for rebuild_season_stats too" do
    expect(described_class.scope_axes(:rebuild_season_stats)).to eq([ :team, :season ])
  end

  it "normalizes the integer form SyncRunItem#kind stores" do
    expect(described_class.scope_axes(SyncRun::SYNC_KINDS[:team_schedule])).to eq([ :team, :season ])
  end

  it "raises on an unknown kind rather than returning nil" do
    expect { described_class.for(:not_a_kind) }.to raise_error(ArgumentError)
  end
end
