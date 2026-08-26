class CreateXgModels < ActiveRecord::Migration[8.1]
  def change
    create_table :xg_models do |t|
      t.string :version, null: false
      t.jsonb :coefficients, null: false, default: {}
      t.datetime :trained_at, null: false
      t.boolean :active, null: false, default: false

      t.timestamps
    end

    add_index :xg_models, :version, unique: true
    # Partial index, not a validation: guarantees at most one active row even under a race.
    add_index :xg_models, :active, unique: true, where: "active"
  end
end
