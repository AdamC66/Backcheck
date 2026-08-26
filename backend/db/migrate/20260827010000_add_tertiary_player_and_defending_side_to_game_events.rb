class AddTertiaryPlayerAndDefendingSideToGameEvents < ActiveRecord::Migration[8.1]
  def change
    add_reference :game_events, :tertiary_player, foreign_key: { to_table: :players }
    add_column :game_events, :home_team_defending_side, :string
  end
end
