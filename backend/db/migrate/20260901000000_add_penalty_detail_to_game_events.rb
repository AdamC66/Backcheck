class AddPenaltyDetailToGameEvents < ActiveRecord::Migration[8.1]
  def change
    add_column :game_events, :infraction, :string
    add_column :game_events, :penalty_type, :string
    add_column :game_events, :penalty_minutes, :integer
  end
end
