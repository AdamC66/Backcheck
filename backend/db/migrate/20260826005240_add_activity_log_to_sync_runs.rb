class AddActivityLogToSyncRuns < ActiveRecord::Migration[8.1]
  def change
    add_column :sync_runs, :activity_log, :jsonb, null: false, default: []
  end
end
