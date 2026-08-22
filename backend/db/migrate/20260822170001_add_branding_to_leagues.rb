class AddBrandingToLeagues < ActiveRecord::Migration[8.1]
  def change
    add_column :leagues, :abbreviation, :string, null: false
    # Rank in the affiliation hierarchy (NHL 1 → AHL 2 → ECHL 3); drives display order
    # and, later, which leagues a TeamAffiliation chain can span.
    add_column :leagues, :tier, :integer, null: false
    add_column :leagues, :logo, :string

    add_index :leagues, :abbreviation, unique: true
  end
end
