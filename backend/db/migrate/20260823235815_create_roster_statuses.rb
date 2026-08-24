class CreateRosterStatuses < ActiveRecord::Migration[8.1]
  def change
    create_table :roster_statuses do |t|
      t.references :player, null: false, foreign_key: true
      t.references :team, null: false, foreign_key: true
      t.references :season, null: false, foreign_key: true

      t.integer :status, null: false
      t.date :started_on, null: false
      t.date :ended_on

      t.timestamps
    end

    # A player with no row here is active by default, so only one period — the current
    # one — is ever open (ended_on null) per player/team/season at a time.
    add_index :roster_statuses, [ :player_id, :team_id, :season_id ], unique: true,
              where: "ended_on IS NULL", name: "index_roster_statuses_on_open_period"
  end
end
