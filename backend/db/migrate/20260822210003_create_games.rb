class CreateGames < ActiveRecord::Migration[8.1]
  def change
    create_table :games do |t|
      t.bigint :nhl_game_id, null: false
      t.references :season, null: false, foreign_key: true
      t.references :home_team, null: false, foreign_key: { to_table: :teams }
      t.references :away_team, null: false, foreign_key: { to_table: :teams }

      t.integer :game_type, null: false
      t.datetime :starts_at, null: false
      # The venue-local calendar date. Distinct from starts_at, since a 7pm PT game is
      # already "tomorrow" in UTC and would otherwise land on the wrong schedule day.
      t.date :game_date, null: false
      t.string :venue
      t.boolean :neutral_site, null: false, default: false

      t.integer :home_score
      t.integer :away_score
      t.string :state, null: false
      t.string :last_period_type

      t.timestamps
    end

    add_index :games, :nhl_game_id, unique: true
    add_index :games, [ :season_id, :game_date ]
  end
end
