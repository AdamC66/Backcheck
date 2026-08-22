class CreateSeasons < ActiveRecord::Migration[8.1]
  def change
    create_table :seasons do |t|
      t.string :label, null: false
      t.date :starts_on, null: false
      t.date :ends_on, null: false

      t.timestamps
    end
    add_index :seasons, :label, unique: true
  end
end
