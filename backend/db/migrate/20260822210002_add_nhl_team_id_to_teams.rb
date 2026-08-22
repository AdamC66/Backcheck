class AddNhlTeamIdToTeams < ActiveRecord::Migration[8.1]
  # Only schedule payloads supply this; standings identify teams by abbreviation alone.
  def change
    add_column :teams, :nhl_team_id, :integer
    add_index :teams, :nhl_team_id, unique: true
  end
end
