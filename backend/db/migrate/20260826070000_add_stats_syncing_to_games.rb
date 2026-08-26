class AddStatsSyncingToGames < ActiveRecord::Migration[8.1]
  def change
    add_column :games, :stats_syncing, :boolean, null: false, default: false
  end
end
