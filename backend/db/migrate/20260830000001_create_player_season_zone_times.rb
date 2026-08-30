class CreatePlayerSeasonZoneTimes < ActiveRecord::Migration[8.1]
  def change
    create_table :player_season_zone_times do |t|
      t.references :player, null: false, foreign_key: true
      t.references :team, null: false, foreign_key: true
      t.references :season, null: false, foreign_key: true
      t.integer :game_type, null: false
      t.integer :games_played, null: false, default: 0

      t.integer :offensive_seconds, null: false, default: 0
      t.integer :neutral_seconds, null: false, default: 0
      t.integer :defensive_seconds, null: false, default: 0
      t.integer :offensive_starts, null: false, default: 0
      t.integer :neutral_starts, null: false, default: 0
      t.integer :defensive_starts, null: false, default: 0
      t.integer :on_the_fly_starts, null: false, default: 0

      t.timestamps
    end

    add_index :player_season_zone_times, [ :player_id, :team_id, :season_id, :game_type ], unique: true,
              name: "index_pszt_on_stint"
  end
end
