class CreateTeamStandings < ActiveRecord::Migration[8.1]
  # One snapshot per team per date, rather than a single row overwritten in place, so
  # "where did the wildcard race stand in January" stays answerable.
  def change
    create_table :team_standings do |t|
      t.references :team, null: false, foreign_key: true
      t.references :season, null: false, foreign_key: true
      t.date :as_of_date, null: false

      t.integer :games_played, null: false
      t.integer :wins, null: false
      t.integer :losses, null: false
      t.integer :ot_losses, null: false
      t.integer :points, null: false
      t.decimal :point_pctg, precision: 6, scale: 5

      t.integer :goals_for, null: false
      t.integer :goals_against, null: false
      t.integer :goal_differential, null: false

      t.integer :regulation_wins
      t.integer :regulation_plus_ot_wins

      t.string :streak_code
      t.integer :streak_count

      t.string :conference_name
      t.integer :conference_sequence
      t.string :division_name
      t.integer :division_sequence
      t.integer :league_sequence
      t.integer :wildcard_sequence

      t.integer :home_wins
      t.integer :home_losses
      t.integer :home_ot_losses
      t.integer :road_wins
      t.integer :road_losses
      t.integer :road_ot_losses
      t.integer :l10_wins
      t.integer :l10_losses
      t.integer :l10_ot_losses

      t.timestamps
    end

    add_index :team_standings, [ :team_id, :season_id, :as_of_date ], unique: true,
              name: "index_team_standings_on_team_season_and_date"
    add_index :team_standings, [ :season_id, :as_of_date ]
  end
end
