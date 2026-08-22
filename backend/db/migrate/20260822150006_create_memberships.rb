class CreateMemberships < ActiveRecord::Migration[8.1]
  def change
    create_table :memberships do |t|
      t.references :user, null: false, foreign_key: true
      t.references :role, null: false, foreign_key: true
      t.references :scopeable, polymorphic: true, null: false

      t.timestamps
    end
    add_index :memberships, [ :user_id, :role_id, :scopeable_type, :scopeable_id ],
              unique: true, name: "index_memberships_on_user_role_and_scope"
  end
end
