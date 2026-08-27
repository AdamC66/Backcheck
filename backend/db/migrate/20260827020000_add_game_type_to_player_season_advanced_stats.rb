class AddGameTypeToPlayerSeasonAdvancedStats < ActiveRecord::Migration[8.1]
  def up
    add_column :player_season_advanced_stats, :game_type, :integer
    # Every row synced so far is from a regular-season game (Game::GAME_TYPES[:regular_season]).
    execute "UPDATE player_season_advanced_stats SET game_type = 2"
    change_column_null :player_season_advanced_stats, :game_type, false

    remove_index :player_season_advanced_stats, name: "index_psas_on_player_season_strength_score_game"
    add_index :player_season_advanced_stats,
              [ :player_id, :season_id, :strength_state, :score_state, :game_type, :as_of_game_id ],
              unique: true, name: "index_psas_on_player_season_strength_score_type_game"
  end

  def down
    remove_index :player_season_advanced_stats, name: "index_psas_on_player_season_strength_score_type_game"
    add_index :player_season_advanced_stats,
              [ :player_id, :season_id, :strength_state, :score_state, :as_of_game_id ],
              unique: true, name: "index_psas_on_player_season_strength_score_game"
    remove_column :player_season_advanced_stats, :game_type
  end
end
