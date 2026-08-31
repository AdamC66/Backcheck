class CreateLineupSlots < ActiveRecord::Migration[8.1]
  def change
    create_table :lineup_slots do |t|
      t.references :lineup, null: false, foreign_key: true
      t.references :player, null: false, foreign_key: true
      t.integer :unit_type, null: false
      t.integer :unit_number
      t.integer :slot_order

      t.timestamps
    end

    add_index :lineup_slots, [ :lineup_id, :player_id, :unit_type ], unique: true,
              name: "index_lineup_slots_on_lineup_player_and_unit_type"
  end
end
