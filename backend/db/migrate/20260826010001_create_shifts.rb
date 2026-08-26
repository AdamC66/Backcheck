class CreateShifts < ActiveRecord::Migration[8.1]
  def change
    create_table :shifts do |t|
      t.references :game, null: false, foreign_key: true
      t.references :team, null: false, foreign_key: true
      t.references :player, null: false, foreign_key: true

      t.bigint :nhl_shift_id, null: false
      t.integer :period, null: false
      t.integer :start_time_seconds, null: false
      t.integer :end_time_seconds, null: false

      t.timestamps
    end

    add_index :shifts, [ :game_id, :nhl_shift_id ], unique: true
  end
end
