class AdminSyncOrchestratorJob < ApplicationJob
  queue_as :ingest

  def perform(sync_run_id)
    AdminSyncOrchestrator.new(sync_run: SyncRun.find(sync_run_id)).call
  end
end
