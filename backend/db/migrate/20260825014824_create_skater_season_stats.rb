class CreateSkaterSeasonStats < ActiveRecord::Migration[8.1]
  def change
    create_table :skater_season_stats do |t|
      t.references :player, null: false, foreign_key: true
      t.references :team, null: false, foreign_key: true
      t.references :season, null: false, foreign_key: true
      # Matches Game::GAME_TYPES so regular-season and playoff totals never mix.
      t.integer :game_type, null: false

      t.integer :games_played, null: false, default: 0
      t.integer :goals, null: false, default: 0
      t.integer :assists, null: false, default: 0
      t.integer :points, null: false, default: 0
      t.integer :plus_minus, null: false, default: 0
      t.integer :pim, null: false, default: 0
      t.integer :hits, null: false, default: 0
      t.integer :power_play_goals, null: false, default: 0
      t.integer :shots_on_goal, null: false, default: 0
      # Games-played-weighted, not attempts-weighted — the boxscore only gives a
      # per-game ratio, never a faceoffs-taken count. See docs/DECISIONS.md.
      t.decimal :faceoff_winning_pctg, precision: 5, scale: 4
      t.integer :time_on_ice_seconds, null: false, default: 0
      t.integer :shifts, null: false, default: 0
      t.integer :blocked_shots, null: false, default: 0
      t.integer :giveaways, null: false, default: 0
      t.integer :takeaways, null: false, default: 0

      t.timestamps
    end

    add_index :skater_season_stats, [ :player_id, :team_id, :season_id, :game_type ], unique: true,
              name: "index_skater_season_stats_on_stint"
  end
end
