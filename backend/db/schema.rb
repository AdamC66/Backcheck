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

ActiveRecord::Schema[8.1].define(version: 2026_08_23_093001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "games", force: :cascade do |t|
    t.integer "away_score"
    t.bigint "away_team_id", null: false
    t.datetime "created_at", null: false
    t.date "game_date", null: false
    t.integer "game_type", null: false
    t.integer "home_score"
    t.bigint "home_team_id", null: false
    t.string "last_period_type"
    t.boolean "neutral_site", default: false, null: false
    t.bigint "nhl_game_id", null: false
    t.bigint "season_id", null: false
    t.datetime "starts_at", null: false
    t.string "state", null: false
    t.datetime "updated_at", null: false
    t.string "venue"
    t.index ["away_team_id"], name: "index_games_on_away_team_id"
    t.index ["home_team_id"], name: "index_games_on_home_team_id"
    t.index ["nhl_game_id"], name: "index_games_on_nhl_game_id", unique: true
    t.index ["season_id", "game_date"], name: "index_games_on_season_id_and_game_date"
    t.index ["season_id"], name: "index_games_on_season_id"
  end

  create_table "leagues", force: :cascade do |t|
    t.string "abbreviation", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "slug", null: false
    t.integer "tier", null: false
    t.datetime "updated_at", null: false
    t.index ["abbreviation"], name: "index_leagues_on_abbreviation", unique: true
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

  create_table "player_external_ids", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "external_id", null: false
    t.integer "matched_by", null: false
    t.bigint "player_id", null: false
    t.string "source", null: false
    t.datetime "updated_at", null: false
    t.index ["player_id"], name: "index_player_external_ids_on_player_id"
    t.index ["source", "external_id"], name: "index_player_external_ids_on_source_and_external_id", unique: true
  end

  create_table "players", force: :cascade do |t|
    t.string "birth_city"
    t.string "birth_country"
    t.date "birth_date"
    t.datetime "created_at", null: false
    t.integer "draft_overall"
    t.integer "draft_round"
    t.bigint "draft_team_id"
    t.string "draft_team_name"
    t.integer "draft_year"
    t.string "first_name", null: false
    t.integer "height_in_inches"
    t.string "last_name", null: false
    t.integer "nhl_player_id"
    t.string "normalized_name", null: false
    t.integer "position", null: false
    t.string "shoots_catches"
    t.datetime "updated_at", null: false
    t.integer "weight_in_pounds"
    t.index ["draft_team_id"], name: "index_players_on_draft_team_id"
    t.index ["nhl_player_id"], name: "index_players_on_nhl_player_id", unique: true
    t.index ["normalized_name", "birth_date"], name: "index_players_on_normalized_name_and_birth_date"
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

  create_table "roster_spots", force: :cascade do |t|
    t.integer "contract_level", default: 0, null: false
    t.boolean "contract_level_inferred", default: false, null: false
    t.datetime "created_at", null: false
    t.integer "jersey_number"
    t.bigint "player_id", null: false
    t.bigint "season_id", null: false
    t.integer "source", null: false
    t.bigint "team_id", null: false
    t.datetime "updated_at", null: false
    t.index ["player_id", "team_id", "season_id"], name: "index_roster_spots_on_player_id_and_team_id_and_season_id", unique: true
    t.index ["player_id"], name: "index_roster_spots_on_player_id"
    t.index ["season_id"], name: "index_roster_spots_on_season_id"
    t.index ["team_id", "season_id"], name: "index_roster_spots_on_team_id_and_season_id"
    t.index ["team_id"], name: "index_roster_spots_on_team_id"
  end

  create_table "seasons", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "ends_on", null: false
    t.integer "hockeytech_season_id"
    t.string "label", null: false
    t.bigint "league_id", null: false
    t.integer "nhl_season_id"
    t.date "starts_on", null: false
    t.datetime "updated_at", null: false
    t.index ["league_id", "hockeytech_season_id"], name: "index_seasons_on_league_id_and_hockeytech_season_id", unique: true
    t.index ["league_id", "label"], name: "index_seasons_on_league_id_and_label", unique: true
    t.index ["league_id"], name: "index_seasons_on_league_id"
    t.index ["nhl_season_id"], name: "index_seasons_on_nhl_season_id", unique: true
  end

  create_table "team_affiliations", force: :cascade do |t|
    t.bigint "affiliate_team_id", null: false
    t.datetime "created_at", null: false
    t.bigint "parent_team_id", null: false
    t.bigint "season_id", null: false
    t.datetime "updated_at", null: false
    t.index ["affiliate_team_id", "season_id"], name: "index_team_affiliations_on_affiliate_team_id_and_season_id", unique: true
    t.index ["affiliate_team_id"], name: "index_team_affiliations_on_affiliate_team_id"
    t.index ["parent_team_id", "season_id"], name: "index_team_affiliations_on_parent_team_id_and_season_id"
    t.index ["parent_team_id"], name: "index_team_affiliations_on_parent_team_id"
    t.index ["season_id"], name: "index_team_affiliations_on_season_id"
  end

  create_table "team_standings", force: :cascade do |t|
    t.date "as_of_date", null: false
    t.string "conference_name"
    t.integer "conference_sequence"
    t.datetime "created_at", null: false
    t.string "division_name"
    t.integer "division_sequence"
    t.integer "games_played", null: false
    t.integer "goal_differential", null: false
    t.integer "goals_against", null: false
    t.integer "goals_for", null: false
    t.integer "home_losses"
    t.integer "home_ot_losses"
    t.integer "home_wins"
    t.integer "l10_losses"
    t.integer "l10_ot_losses"
    t.integer "l10_wins"
    t.integer "league_sequence"
    t.integer "losses", null: false
    t.integer "ot_losses", null: false
    t.decimal "point_pctg", precision: 6, scale: 5
    t.integer "points", null: false
    t.integer "regulation_plus_ot_wins"
    t.integer "regulation_wins"
    t.integer "road_losses"
    t.integer "road_ot_losses"
    t.integer "road_wins"
    t.bigint "season_id", null: false
    t.string "streak_code"
    t.integer "streak_count"
    t.bigint "team_id", null: false
    t.datetime "updated_at", null: false
    t.integer "wildcard_sequence"
    t.integer "wins", null: false
    t.index ["season_id", "as_of_date"], name: "index_team_standings_on_season_id_and_as_of_date"
    t.index ["season_id"], name: "index_team_standings_on_season_id"
    t.index ["team_id", "season_id", "as_of_date"], name: "index_team_standings_on_team_season_and_date", unique: true
    t.index ["team_id"], name: "index_team_standings_on_team_id"
  end

  create_table "teams", force: :cascade do |t|
    t.string "abbreviation", null: false
    t.datetime "created_at", null: false
    t.integer "hockeytech_team_id"
    t.bigint "league_id", null: false
    t.string "name", null: false
    t.integer "nhl_team_id"
    t.string "primary_color"
    t.string "secondary_color"
    t.string "tertiary_color"
    t.datetime "updated_at", null: false
    t.index ["league_id", "abbreviation"], name: "index_teams_on_league_id_and_abbreviation", unique: true
    t.index ["league_id", "hockeytech_team_id"], name: "index_teams_on_league_id_and_hockeytech_team_id", unique: true
    t.index ["league_id"], name: "index_teams_on_league_id"
    t.index ["nhl_team_id"], name: "index_teams_on_nhl_team_id", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.boolean "is_super_admin", default: false, null: false
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "games", "seasons"
  add_foreign_key "games", "teams", column: "away_team_id"
  add_foreign_key "games", "teams", column: "home_team_id"
  add_foreign_key "memberships", "roles"
  add_foreign_key "memberships", "users"
  add_foreign_key "player_external_ids", "players"
  add_foreign_key "players", "teams", column: "draft_team_id"
  add_foreign_key "roster_spots", "players"
  add_foreign_key "roster_spots", "seasons"
  add_foreign_key "roster_spots", "teams"
  add_foreign_key "seasons", "leagues"
  add_foreign_key "team_affiliations", "seasons"
  add_foreign_key "team_affiliations", "teams", column: "affiliate_team_id"
  add_foreign_key "team_affiliations", "teams", column: "parent_team_id"
  add_foreign_key "team_standings", "seasons"
  add_foreign_key "team_standings", "teams"
  add_foreign_key "teams", "leagues"
end
