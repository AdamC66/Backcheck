class CreateLeagues < ActiveRecord::Migration[8.1]
  def change
    create_table :leagues do |t|
      t.string :name, null: false
      t.string :slug, null: false

      t.timestamps
    end
    add_index :leagues, :slug, unique: true
  end
end
