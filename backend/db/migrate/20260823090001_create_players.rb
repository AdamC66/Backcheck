class CreatePlayers < ActiveRecord::Migration[8.1]
  def change
    create_table :players do |t|
      t.integer :nhl_player_id
      t.string :first_name, null: false
      t.string :last_name, null: false
      # Match key. The sources disagree on diacritics and punctuation — one NHL payload
      # holds "David Kampf" and "Jani Hakanpää" a few lines apart.
      t.string :normalized_name, null: false

      t.date :birth_date
      t.integer :position, null: false
      t.string :shoots_catches
      t.integer :height_in_inches
      t.integer :weight_in_pounds
      t.string :birth_city
      t.string :birth_country

      t.integer :draft_year
      t.integer :draft_round
      t.integer :draft_overall
      # A pre-relocation franchise has no teams row, so the name is the stored truth
      # and the reference is best-effort.
      t.string :draft_team_name
      t.references :draft_team, foreign_key: { to_table: :teams }

      t.timestamps
    end

    add_index :players, :nhl_player_id, unique: true
    add_index :players, [ :normalized_name, :birth_date ]
  end
end
