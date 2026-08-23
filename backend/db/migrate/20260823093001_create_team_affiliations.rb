class CreateTeamAffiliations < ActiveRecord::Migration[8.1]
  def change
    create_table :team_affiliations do |t|
      t.references :parent_team, null: false, foreign_key: { to_table: :teams }
      t.references :affiliate_team, null: false, foreign_key: { to_table: :teams }
      t.references :season, null: false, foreign_key: true

      t.timestamps
    end

    # One parent per affiliate per season — an AHL team affiliates with exactly one NHL
    # club at a time. The reverse isn't unique: a parent legitimately has two affiliates,
    # one AHL and one ECHL, in the same season.
    add_index :team_affiliations, [ :affiliate_team_id, :season_id ], unique: true
    add_index :team_affiliations, [ :parent_team_id, :season_id ]
  end
end
