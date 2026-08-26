require "rails_helper"

RSpec.describe "Api::V1::Admin::SyncRuns", type: :request do
  let(:super_admin) { create(:user, is_super_admin: true) }
  let(:team) { create(:team) }

  it "rejects a non-super-admin" do
    get "/api/v1/admin/sync_runs", headers: auth_headers(create(:user))

    expect(response).to have_http_status(:forbidden)
  end

  it "lists recent runs with status counts" do
    create(:sync_run, team: team, status: SyncRun::STATUSES[:completed])

    get "/api/v1/admin/sync_runs", headers: auth_headers(super_admin)

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["data"].size).to eq(1)
    expect(response.parsed_body.dig("meta", "counts", "completed")).to eq(1)
  end

  it "creates a queued run for a team-scoped kind and enqueues the orchestrator job" do
    allow(AdminSyncOrchestratorJob).to receive(:perform_later)

    post "/api/v1/admin/sync_runs",
         params: { sync_kinds: [ "team_roster" ], team_id: team.id },
         headers: auth_headers(super_admin)

    expect(response).to have_http_status(:created)
    run_id = response.parsed_body.dig("data", "id")
    expect(response.parsed_body.dig("data", "status")).to eq("queued")
    expect(AdminSyncOrchestratorJob).to have_received(:perform_later).with(run_id)
  end

  it "rejects a kind requesting a season it wasn't given" do
    post "/api/v1/admin/sync_runs",
         params: { sync_kinds: [ "team_schedule" ], team_id: team.id },
         headers: auth_headers(super_admin)

    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body.dig("error", "message")).to include("requires a season")
  end

  it "shows a run's items and activity log" do
    run = create(:sync_run, team: team)
    run.sync_run_items.create!(kind: SyncRun::SYNC_KINDS[:team_roster], team: team)
    run.log("Run started (1 step(s))")

    get "/api/v1/admin/sync_runs/#{run.id}", headers: auth_headers(super_admin)

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "items").size).to eq(1)
    expect(response.parsed_body.dig("data", "activity_log").last["message"]).to eq("Run started (1 step(s))")
  end

  it "cancels a queued run" do
    run = create(:sync_run, team: team)

    post "/api/v1/admin/sync_runs/#{run.id}/cancel", headers: auth_headers(super_admin)

    expect(response).to have_http_status(:ok)
    expect(run.reload.status).to eq(SyncRun::STATUSES[:cancelled])
  end

  it "refuses to cancel a run that already finished" do
    run = create(:sync_run, team: team, status: SyncRun::STATUSES[:completed])

    post "/api/v1/admin/sync_runs/#{run.id}/cancel", headers: auth_headers(super_admin)

    expect(response).to have_http_status(:unprocessable_content)
  end
end
