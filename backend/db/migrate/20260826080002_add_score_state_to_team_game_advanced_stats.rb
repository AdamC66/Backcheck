class AddScoreStateToTeamGameAdvancedStats < ActiveRecord::Migration[8.1]
  def change
    add_column :team_game_advanced_stats, :score_state, :string, null: false, default: "all"

    remove_index :team_game_advanced_stats, name: "index_tgas_on_game_team_strength_state"
    add_index :team_game_advanced_stats, [ :game_id, :team_id, :strength_state, :score_state ], unique: true,
              name: "index_tgas_on_game_team_strength_score"
  end
end
