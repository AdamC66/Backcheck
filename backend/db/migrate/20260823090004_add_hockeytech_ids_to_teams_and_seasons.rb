class AddHockeytechIdsToTeamsAndSeasons < ActiveRecord::Migration[8.1]
  # Unique per league rather than globally like the nhl_* ids: the AHL and ECHL feeds
  # may number their teams and seasons in the same range, and nothing upstream says
  # otherwise (Cincinnati is ECHL team 5, Abbotsford is AHL team 440).
  def change
    add_column :teams, :hockeytech_team_id, :integer
    add_column :seasons, :hockeytech_season_id, :integer

    add_index :teams, [ :league_id, :hockeytech_team_id ], unique: true
    add_index :seasons, [ :league_id, :hockeytech_season_id ], unique: true
  end
end
