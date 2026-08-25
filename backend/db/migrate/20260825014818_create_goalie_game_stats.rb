class CreateGoalieGameStats < ActiveRecord::Migration[8.1]
  def change
    create_table :goalie_game_stats do |t|
      t.references :player, null: false, foreign_key: true
      t.references :game, null: false, foreign_key: true
      t.references :team, null: false, foreign_key: true

      t.integer :even_strength_shots_against, null: false, default: 0
      t.integer :even_strength_goals_against, null: false, default: 0
      t.integer :power_play_shots_against, null: false, default: 0
      t.integer :power_play_goals_against, null: false, default: 0
      t.integer :shorthanded_shots_against, null: false, default: 0
      t.integer :shorthanded_goals_against, null: false, default: 0
      t.integer :shots_against, null: false, default: 0
      t.integer :saves, null: false, default: 0
      t.integer :goals_against, null: false, default: 0
      t.integer :pim, null: false, default: 0
      t.integer :time_on_ice_seconds, null: false, default: 0
      t.boolean :starter, null: false, default: false
      # W / L / O (OT loss), null for a backup who didn't see the ice.
      t.string :decision

      t.timestamps
    end

    add_index :goalie_game_stats, [ :player_id, :game_id ], unique: true
  end
end
