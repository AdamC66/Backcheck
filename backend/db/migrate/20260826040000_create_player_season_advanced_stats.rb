class CreatePlayerSeasonAdvancedStats < ActiveRecord::Migration[8.1]
  def change
    create_table :player_season_advanced_stats do |t|
      t.references :player, null: false, foreign_key: true
      t.references :team, null: false, foreign_key: true
      t.references :season, null: false, foreign_key: true
      # The chain's boundary marker: this row is the running total through this game.
      t.references :as_of_game, null: false, foreign_key: { to_table: :games }

      t.string :strength_state, null: false, default: "all"
      t.integer :games_played, null: false, default: 0
      t.integer :corsi_for, null: false, default: 0
      t.integer :corsi_against, null: false, default: 0
      t.integer :fenwick_for, null: false, default: 0
      t.integer :fenwick_against, null: false, default: 0
      t.decimal :xg_for, precision: 6, scale: 3, null: false, default: 0
      t.decimal :xg_against, precision: 6, scale: 3, null: false, default: 0
      t.integer :zone_entries, null: false, default: 0
      t.integer :zone_exits, null: false, default: 0
      t.integer :toi_seconds, null: false, default: 0
      # Set when an earlier game in the chain is corrected; cleared once TASK-63
      # rebuilds the chain forward from that point.
      t.boolean :stale, null: false, default: false

      t.timestamps
    end

    add_index :player_season_advanced_stats, [ :player_id, :season_id, :strength_state, :as_of_game_id ],
              unique: true, name: "index_psas_on_player_season_strength_game"
  end
end
