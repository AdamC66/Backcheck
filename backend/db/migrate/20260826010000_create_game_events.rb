class CreateGameEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :game_events do |t|
      t.references :game, null: false, foreign_key: true
      # Nullable: not every event has a clean team attribution (e.g. some stoppages).
      t.references :team, foreign_key: true
      t.references :primary_player, null: false, foreign_key: { to_table: :players }
      t.references :secondary_player, foreign_key: { to_table: :players }

      t.bigint :nhl_event_id, null: false
      t.integer :period, null: false
      t.integer :period_time_seconds, null: false
      t.integer :event_type, null: false
      t.integer :shot_type
      t.integer :zone
      t.integer :strength_state
      t.integer :x_coord
      t.integer :y_coord

      t.timestamps
    end

    add_index :game_events, [ :game_id, :nhl_event_id ], unique: true
  end
end
