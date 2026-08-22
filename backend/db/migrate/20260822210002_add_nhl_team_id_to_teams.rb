class AddNhlTeamIdToTeams < ActiveRecord::Migration[8.1]
  # The upstream numeric team id. Only NHL teams have one, and only the schedule
  # payloads supply it — standings identify teams by abbreviation alone.
  def change
    add_column :teams, :nhl_team_id, :integer
    add_index :teams, :nhl_team_id, unique: true
  end
end
