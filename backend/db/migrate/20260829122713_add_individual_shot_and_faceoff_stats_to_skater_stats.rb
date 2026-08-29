class AddIndividualShotAndFaceoffStatsToSkaterStats < ActiveRecord::Migration[8.1]
  def change
    %i[skater_game_stats skater_season_stats].each do |table|
      add_column table, :faceoff_wins, :integer, null: false, default: 0
      add_column table, :faceoff_losses, :integer, null: false, default: 0
      add_column table, :shots_attempted, :integer, null: false, default: 0
      add_column table, :missed_shots, :integer, null: false, default: 0
      add_column table, :shots_blocked_against, :integer, null: false, default: 0
    end
  end
end
