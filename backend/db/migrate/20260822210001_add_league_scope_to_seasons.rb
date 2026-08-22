class AddLeagueScopeToSeasons < ActiveRecord::Migration[8.1]
  # Table is empty and unreferenced, so league_id can go in as null: false directly.
  def change
    add_reference :seasons, :league, null: false, foreign_key: true
    add_column :seasons, :nhl_season_id, :integer

    remove_index :seasons, :label
    add_index :seasons, [ :league_id, :label ], unique: true
    # Repeated NULLs are fine under a unique index; only NHL seasons carry an id.
    add_index :seasons, :nhl_season_id, unique: true
  end
end
