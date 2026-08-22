class DropLogoFilenameColumns < ActiveRecord::Migration[8.1]
  # `has_one_attached :logo` defines a `logo` reader, which would collide with these
  # columns. The filename only ever mattered at seed time, to find the file in data/.
  def change
    remove_column :leagues, :logo, :string
    remove_column :teams, :logo, :string
  end
end
