class CreatePlayerExternalIds < ActiveRecord::Migration[8.1]
  def change
    create_table :player_external_ids do |t|
      t.references :player, null: false, foreign_key: true
      t.string :source, null: false
      # String, not integer: a later source may key on a slug.
      t.string :external_id, null: false
      # How the player was matched, since only the NHL id is ever authoritative.
      t.integer :matched_by, null: false

      t.timestamps
    end

    add_index :player_external_ids, [ :source, :external_id ], unique: true
  end
end
