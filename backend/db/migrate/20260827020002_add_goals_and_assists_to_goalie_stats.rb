class AddGoalsAndAssistsToGoalieStats < ActiveRecord::Migration[8.1]
  def change
    add_column :goalie_game_stats, :goals, :integer, default: 0, null: false
    add_column :goalie_game_stats, :assists, :integer, default: 0, null: false
    add_column :goalie_season_stats, :goals, :integer, default: 0, null: false
    add_column :goalie_season_stats, :assists, :integer, default: 0, null: false
  end
end
