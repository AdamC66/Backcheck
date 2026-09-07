class AddIxgToPlayerAdvancedStats < ActiveRecord::Migration[8.1]
  def change
    add_column :player_game_advanced_stats, :ixg, :decimal, precision: 6, scale: 3, default: 0, null: false
    add_column :player_season_advanced_stats, :ixg, :decimal, precision: 6, scale: 3, default: 0, null: false
  end
end
