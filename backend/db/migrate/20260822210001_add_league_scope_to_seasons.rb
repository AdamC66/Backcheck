class AddLeagueScopeToSeasons < ActiveRecord::Migration[8.1]
  # Seasons were global, but each league runs its own with its own dates. The table is
  # empty and nothing references it yet, so league_id can go in as null: false directly.
  def change
    add_reference :seasons, :league, null: false, foreign_key: true
    add_column :seasons, :nhl_season_id, :integer

    remove_index :seasons, :label
    add_index :seasons, [ :league_id, :label ], unique: true
    # Postgres allows repeated NULLs under a unique index, which is what makes this
    # "unique where present" — only NHL seasons carry an upstream id.
    add_index :seasons, :nhl_season_id, unique: true
  end
end
