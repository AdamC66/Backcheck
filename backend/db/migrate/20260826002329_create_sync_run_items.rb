class CreateSyncRunItems < ActiveRecord::Migration[8.1]
  def change
    create_table :sync_run_items do |t|
      t.references :sync_run, null: false, foreign_key: true
      # Nullable: standings and daily-scores runs have no team axis.
      t.references :team, foreign_key: true

      t.integer :kind, null: false
      t.integer :status, null: false, default: 0

      t.datetime :started_at
      t.datetime :finished_at
      t.text :error_message

      t.timestamps
    end

    add_index :sync_run_items, :status
  end
end
