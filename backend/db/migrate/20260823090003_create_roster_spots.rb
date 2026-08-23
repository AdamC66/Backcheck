class CreateRosterSpots < ActiveRecord::Migration[8.1]
  def change
    create_table :roster_spots do |t|
      t.references :player, null: false, foreign_key: true
      t.references :team, null: false, foreign_key: true
      t.references :season, null: false, foreign_key: true

      t.integer :contract_level, null: false, default: 0
      # The ECHL feed sends status empty, so a level there is inherited from the AHL
      # roster rather than reported, and shouldn't be read as fact.
      t.boolean :contract_level_inferred, null: false, default: false
      t.integer :source, null: false
      t.integer :jersey_number

      t.timestamps
    end

    # One spot per player per team per season — so a player can hold three in a year,
    # one for each tier he was assigned to.
    add_index :roster_spots, [ :player_id, :team_id, :season_id ], unique: true
    add_index :roster_spots, [ :team_id, :season_id ]
  end
end
