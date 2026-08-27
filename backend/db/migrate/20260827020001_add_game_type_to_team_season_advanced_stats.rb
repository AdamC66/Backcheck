class AddGameTypeToTeamSeasonAdvancedStats < ActiveRecord::Migration[8.1]
  def up
    add_column :team_season_advanced_stats, :game_type, :integer
    # Every row synced so far is from a regular-season game (Game::GAME_TYPES[:regular_season]).
    execute "UPDATE team_season_advanced_stats SET game_type = 2"
    change_column_null :team_season_advanced_stats, :game_type, false

    remove_index :team_season_advanced_stats, name: "index_tsas_on_team_season_strength_score"
    add_index :team_season_advanced_stats, [ :team_id, :season_id, :strength_state, :score_state, :game_type ],
              unique: true, name: "index_tsas_on_team_season_strength_score_type"
  end

  def down
    remove_index :team_season_advanced_stats, name: "index_tsas_on_team_season_strength_score_type"
    add_index :team_season_advanced_stats, [ :team_id, :season_id, :strength_state, :score_state ],
              unique: true, name: "index_tsas_on_team_season_strength_score"
    remove_column :team_season_advanced_stats, :game_type
  end
end
