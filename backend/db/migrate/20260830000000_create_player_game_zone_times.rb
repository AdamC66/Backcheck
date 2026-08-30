class CreatePlayerGameZoneTimes < ActiveRecord::Migration[8.1]
  def change
    create_table :player_game_zone_times do |t|
      t.references :game, null: false, foreign_key: true
      t.references :player, null: false, foreign_key: true
      t.references :team, null: false, foreign_key: true

      t.integer :offensive_seconds, null: false, default: 0
      t.integer :neutral_seconds, null: false, default: 0
      t.integer :defensive_seconds, null: false, default: 0
      t.integer :offensive_starts, null: false, default: 0
      t.integer :neutral_starts, null: false, default: 0
      t.integer :defensive_starts, null: false, default: 0
      t.integer :on_the_fly_starts, null: false, default: 0

      t.timestamps
    end

    add_index :player_game_zone_times, [ :game_id, :player_id ], unique: true
  end
end
