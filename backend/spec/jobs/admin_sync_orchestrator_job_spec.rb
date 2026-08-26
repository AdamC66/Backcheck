require "rails_helper"

RSpec.describe AdminSyncOrchestratorJob do
  it "loads the sync run and hands it to the orchestrator through the ingest queue" do
    team = create(:team)
    run = create(:sync_run, team: team, sync_kinds: [ SyncRun::SYNC_KINDS[:team_roster] ])
    allow(SyncTeamRoster).to receive(:new).and_return(instance_double(SyncTeamRoster, call: []))

    described_class.perform_now(run.id)

    expect(run.reload.status).to eq(SyncRun::STATUSES[:completed])
    expect(described_class.new.queue_name).to eq("ingest")
  end
end
