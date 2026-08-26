class AddScoreStateToTeamSeasonAdvancedStats < ActiveRecord::Migration[8.1]
  def change
    add_column :team_season_advanced_stats, :score_state, :string, null: false, default: "all"

    remove_index :team_season_advanced_stats, name: "index_tsas_on_team_season_strength_state"
    add_index :team_season_advanced_stats, [ :team_id, :season_id, :strength_state, :score_state ], unique: true,
              name: "index_tsas_on_team_season_strength_score"
  end
end
