class AddBrandingToTeams < ActiveRecord::Migration[8.1]
  def change
    add_column :teams, :abbreviation, :string, null: false
    add_column :teams, :logo, :string
    add_column :teams, :primary_color, :string
    add_column :teams, :secondary_color, :string
    add_column :teams, :tertiary_color, :string

    # Abbreviations collide across tiers (CGY is both the Flames and the Wranglers),
    # so they're only unique within a league.
    add_index :teams, [ :league_id, :abbreviation ], unique: true

    # Dropped rather than left null: the manifests carry full names, and a real
    # location model (arena, timezone) is worth more than a split-off city string.
    remove_column :teams, :city, :string
  end
end
