class CreateXgTrainingRuns < ActiveRecord::Migration[8.1]
  def change
    create_table :xg_training_runs do |t|
      t.integer :status, null: false, default: 0
      t.string :label
      t.string :csv_path, null: false
      t.string :csv_sha256, null: false
      t.integer :row_count, null: false, default: 0
      t.integer :goal_count, null: false, default: 0
      t.jsonb :manifest, null: false, default: {}
      t.jsonb :feature_set
      t.jsonb :coefficients
      t.jsonb :metrics
      t.jsonb :calibration
      t.jsonb :sample_games
      t.text :notes
      t.string :source_file
      t.references :xg_model, foreign_key: true

      t.timestamps
    end

    add_index :xg_training_runs, :status
  end
end
