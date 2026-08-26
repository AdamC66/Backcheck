class CreateSyncRuns < ActiveRecord::Migration[8.1]
  def change
    create_table :sync_runs do |t|
      t.references :league, foreign_key: true
      t.references :season, foreign_key: true
      t.references :team, foreign_key: true
      t.references :triggered_by, null: false, foreign_key: { to_table: :users }

      t.integer :sync_kinds, array: true, null: false, default: []
      t.integer :status, null: false, default: 0
      t.integer :total_steps, null: false, default: 0
      t.integer :current_step, null: false, default: 0
      t.string :current_step_label
      t.float :min_interval, null: false

      t.datetime :started_at
      t.datetime :finished_at
      t.text :error_message

      t.timestamps
    end

    add_index :sync_runs, :status
  end
end
