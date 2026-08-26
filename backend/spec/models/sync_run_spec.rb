require "rails_helper"

RSpec.describe SyncRun, type: :model do
  it "is valid with a triggering user and at least one known sync kind" do
    expect(build(:sync_run)).to be_valid
  end

  it "rejects a sync kind that isn't in the known set" do
    run = build(:sync_run, sync_kinds: [ 999 ])

    expect(run).not_to be_valid
    expect(run.errors[:sync_kinds]).to include("contains unknown kind(s): 999")
  end

  it "defaults a run with zero items to queued at 0%" do
    run = create(:sync_run)

    expect(run.status).to eq(SyncRun::STATUSES[:queued])
    expect(run.percent_complete).to eq(0)
  end

  it "computes percent_complete without dividing by zero" do
    run = build(:sync_run, total_steps: 4, current_step: 1)

    expect(run.percent_complete).to eq(25)
  end

  it "appends a timestamped message to the activity log" do
    run = create(:sync_run)

    run.log("Starting team roster")

    expect(run.activity_log.last).to include("message" => "Starting team roster")
  end

  it "caps the activity log instead of growing it forever" do
    run = create(:sync_run)

    (SyncRun::ACTIVITY_LOG_LIMIT + 5).times { |n| run.log("event #{n}") }

    expect(run.activity_log.size).to eq(SyncRun::ACTIVITY_LOG_LIMIT)
    expect(run.activity_log.first["message"]).to eq("event 5")
  end
end
