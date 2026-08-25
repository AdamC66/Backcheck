class CreateGoalieSeasonStats < ActiveRecord::Migration[8.1]
  def change
    create_table :goalie_season_stats do |t|
      t.references :player, null: false, foreign_key: true
      t.references :team, null: false, foreign_key: true
      t.references :season, null: false, foreign_key: true
      t.integer :game_type, null: false

      t.integer :games_played, null: false, default: 0
      t.integer :games_started, null: false, default: 0
      t.integer :wins, null: false, default: 0
      t.integer :losses, null: false, default: 0
      t.integer :ot_losses, null: false, default: 0
      t.integer :shutouts, null: false, default: 0
      t.integer :even_strength_shots_against, null: false, default: 0
      t.integer :even_strength_goals_against, null: false, default: 0
      t.integer :power_play_shots_against, null: false, default: 0
      t.integer :power_play_goals_against, null: false, default: 0
      t.integer :shorthanded_shots_against, null: false, default: 0
      t.integer :shorthanded_goals_against, null: false, default: 0
      t.integer :shots_against, null: false, default: 0
      t.integer :saves, null: false, default: 0
      t.integer :goals_against, null: false, default: 0
      t.integer :pim, null: false, default: 0
      t.integer :time_on_ice_seconds, null: false, default: 0

      t.timestamps
    end

    add_index :goalie_season_stats, [ :player_id, :team_id, :season_id, :game_type ], unique: true,
              name: "index_goalie_season_stats_on_stint"
  end
end
