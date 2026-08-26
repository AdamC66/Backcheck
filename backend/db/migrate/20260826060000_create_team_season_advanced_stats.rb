class CreateTeamSeasonAdvancedStats < ActiveRecord::Migration[8.1]
  def change
    create_table :team_season_advanced_stats do |t|
      t.references :team, null: false, foreign_key: true
      t.references :season, null: false, foreign_key: true

      t.string :strength_state, null: false, default: "all"
      t.integer :games_played, null: false, default: 0
      t.integer :corsi_for, null: false, default: 0
      t.integer :corsi_against, null: false, default: 0
      t.integer :fenwick_for, null: false, default: 0
      t.integer :fenwick_against, null: false, default: 0
      t.decimal :xg_for, precision: 6, scale: 3, null: false, default: 0
      t.decimal :xg_against, precision: 6, scale: 3, null: false, default: 0
      t.integer :faceoff_wins, null: false, default: 0
      t.integer :faceoff_losses, null: false, default: 0
      t.decimal :pdo, precision: 6, scale: 3, null: false, default: 0
      t.integer :toi_seconds, null: false, default: 0

      t.timestamps
    end

    add_index :team_season_advanced_stats, [ :team_id, :season_id, :strength_state ], unique: true,
              name: "index_tsas_on_team_season_strength_state"
  end
end
