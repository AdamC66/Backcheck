class AddFailedGamesToSyncRunItems < ActiveRecord::Migration[8.1]
  def change
    add_column :sync_run_items, :failed_games, :jsonb, null: false, default: []
  end
end
