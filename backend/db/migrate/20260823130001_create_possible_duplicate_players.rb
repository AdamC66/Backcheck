class CreatePossibleDuplicatePlayers < ActiveRecord::Migration[8.1]
  def change
    create_table :possible_duplicate_players do |t|
      # Always the lower id of the pair, so the same two players can't be flagged
      # twice regardless of which one a given sync happens to discover first.
      t.references :player_a, null: false, foreign_key: { to_table: :players }
      t.references :player_b, null: false, foreign_key: { to_table: :players }
      t.text :detail, null: false
      t.datetime :resolved_at

      t.timestamps
    end

    add_index :possible_duplicate_players, [ :player_a_id, :player_b_id ], unique: true
  end
end
