class CreatePlayerGameAdvancedStats < ActiveRecord::Migration[8.1]
  def change
    create_table :player_game_advanced_stats do |t|
      t.references :game, null: false, foreign_key: true
      t.references :player, null: false, foreign_key: true
      t.references :team, null: false, foreign_key: true
      t.references :xg_model, null: false, foreign_key: true

      t.string :strength_state, null: false, default: "all"
      t.integer :corsi_for, null: false, default: 0
      t.integer :corsi_against, null: false, default: 0
      t.integer :fenwick_for, null: false, default: 0
      t.integer :fenwick_against, null: false, default: 0
      t.decimal :xg_for, precision: 6, scale: 3, null: false, default: 0
      t.decimal :xg_against, precision: 6, scale: 3, null: false, default: 0
      t.integer :zone_entries, null: false, default: 0
      t.integer :zone_exits, null: false, default: 0
      t.integer :toi_seconds, null: false, default: 0

      t.timestamps
    end

    add_index :player_game_advanced_stats, [ :game_id, :player_id, :strength_state ], unique: true,
              name: "index_pgas_on_game_player_strength_state"
  end
end
