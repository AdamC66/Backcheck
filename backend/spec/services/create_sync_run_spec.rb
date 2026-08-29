require "rails_helper"

RSpec.describe CreateSyncRun do
  let(:user) { create(:user) }
  let(:team) { create(:team) }

  it "builds a queued run for a valid team-scoped kind" do
    result = described_class.new(triggered_by: user, sync_kinds: [ "team_roster" ], team: team).call

    expect(result.success?).to be true
    expect(result.result).to be_persisted
    expect(result.result.status).to eq(SyncRun::STATUSES[:queued])
  end

  it "rejects a kind missing its required scope" do
    result = described_class.new(triggered_by: user, sync_kinds: [ "team_schedule" ], team: team).call

    expect(result.success?).to be false
    expect(result.errors).to include(a_string_matching(/requires a season/))
  end

  # Regression guard for TASK-98: a duplicated kind in the request shouldn't build
  # two identical items and double the work for it.
  it "dedupes a sync kind requested more than once" do
    result = described_class.new(triggered_by: user, sync_kinds: [ "team_roster", "team_roster" ], team: team).call

    expect(result.success?).to be true
    expect(result.result.sync_kinds).to eq([ SyncRun::SYNC_KINDS[:team_roster] ])
  end
end
