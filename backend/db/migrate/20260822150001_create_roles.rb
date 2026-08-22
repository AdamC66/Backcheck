class CreateRoles < ActiveRecord::Migration[8.1]
  def change
    create_table :roles do |t|
      t.string :key, null: false
      t.string :label, null: false
      t.string :scope_type, null: false

      t.timestamps
    end
    add_index :roles, :key, unique: true
  end
end
