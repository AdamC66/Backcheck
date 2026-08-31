class CreateLineups < ActiveRecord::Migration[8.1]
  def change
    create_table :lineups do |t|
      t.references :team, null: false, foreign_key: true
      t.references :game, null: false, foreign_key: true

      t.timestamps
    end

    add_index :lineups, [ :team_id, :game_id ], unique: true
  end
end
