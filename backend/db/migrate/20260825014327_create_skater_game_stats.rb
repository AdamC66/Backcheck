class CreateSkaterGameStats < ActiveRecord::Migration[8.1]
  def change
    create_table :skater_game_stats do |t|
      t.references :player, null: false, foreign_key: true
      t.references :game, null: false, foreign_key: true
      # Not inferred from roster_spots or games.home/away_team_id: the team a player
      # suited up for in a specific game must not move if he's traded again later.
      t.references :team, null: false, foreign_key: true

      t.integer :goals, null: false, default: 0
      t.integer :assists, null: false, default: 0
      t.integer :points, null: false, default: 0
      t.integer :plus_minus, null: false, default: 0
      t.integer :pim, null: false, default: 0
      t.integer :hits, null: false, default: 0
      t.integer :power_play_goals, null: false, default: 0
      t.integer :shots_on_goal, null: false, default: 0
      t.decimal :faceoff_winning_pctg, precision: 5, scale: 4
      t.integer :time_on_ice_seconds, null: false, default: 0
      t.integer :shifts, null: false, default: 0
      t.integer :blocked_shots, null: false, default: 0
      t.integer :giveaways, null: false, default: 0
      t.integer :takeaways, null: false, default: 0

      t.timestamps
    end

    add_index :skater_game_stats, [ :player_id, :game_id ], unique: true
  end
end
