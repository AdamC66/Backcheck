# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_08_22_160001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "leagues", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_leagues_on_slug", unique: true
  end

  create_table "memberships", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "role_id", null: false
    t.bigint "scopeable_id", null: false
    t.string "scopeable_type", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["role_id"], name: "index_memberships_on_role_id"
    t.index ["scopeable_type", "scopeable_id"], name: "index_memberships_on_scopeable"
    t.index ["user_id", "role_id", "scopeable_type", "scopeable_id"], name: "index_memberships_on_user_role_and_scope", unique: true
    t.index ["user_id"], name: "index_memberships_on_user_id"
  end

  create_table "revoked_tokens", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "jti", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_revoked_tokens_on_expires_at"
    t.index ["jti"], name: "index_revoked_tokens_on_jti", unique: true
  end

  create_table "roles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "key", null: false
    t.string "label", null: false
    t.string "scope_type", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_roles_on_key", unique: true
  end

  create_table "seasons", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "ends_on", null: false
    t.string "label", null: false
    t.date "starts_on", null: false
    t.datetime "updated_at", null: false
    t.index ["label"], name: "index_seasons_on_label", unique: true
  end

  create_table "teams", force: :cascade do |t|
    t.string "city"
    t.datetime "created_at", null: false
    t.bigint "league_id", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["league_id"], name: "index_teams_on_league_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.boolean "is_super_admin", default: false, null: false
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "memberships", "roles"
  add_foreign_key "memberships", "users"
  add_foreign_key "teams", "leagues"
end
