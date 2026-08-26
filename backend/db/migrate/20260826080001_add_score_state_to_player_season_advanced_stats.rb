class AddScoreStateToPlayerSeasonAdvancedStats < ActiveRecord::Migration[8.1]
  def change
    add_column :player_season_advanced_stats, :score_state, :string, null: false, default: "all"

    remove_index :player_season_advanced_stats, name: "index_psas_on_player_season_strength_game"
    add_index :player_season_advanced_stats, [ :player_id, :season_id, :strength_state, :score_state, :as_of_game_id ],
              unique: true, name: "index_psas_on_player_season_strength_score_game"
  end
end
