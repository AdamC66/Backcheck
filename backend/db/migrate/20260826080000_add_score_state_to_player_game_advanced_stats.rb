class AddScoreStateToPlayerGameAdvancedStats < ActiveRecord::Migration[8.1]
  def change
    add_column :player_game_advanced_stats, :score_state, :string, null: false, default: "all"

    remove_index :player_game_advanced_stats, name: "index_pgas_on_game_player_strength_state"
    add_index :player_game_advanced_stats, [ :game_id, :player_id, :strength_state, :score_state ], unique: true,
              name: "index_pgas_on_game_player_strength_score"
  end
end
