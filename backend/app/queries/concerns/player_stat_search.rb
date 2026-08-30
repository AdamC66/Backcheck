# The league-wide skater and goalie stat tables (EPIC-14): one row per player, summed
# across every team stint in the league+season, optionally joined to advanced-stat
# snapshots. Wires the generic list concerns to that aggregation; subclasses supply the
# stat model, the columns to sum, computed columns, and whether the advanced join runs.
module PlayerStatSearch
  extend ActiveSupport::Concern

  include Columned
  include Filterable
  include Searchable
  include Sortable
  include Paginated

  class NotFound < StandardError; end

  FLOAT_FORMATS = %w[decimal1 decimal2 pct1 pct3].freeze
  STRENGTH_LABELS = { "all" => "All", "5v5" => "5v5", "pp" => "PP", "sh" => "SH" }.freeze

  included do
    filter :league, type: :select, values: -> { League.order(:tier).pluck(:slug) }, default: "nhl"
    filter :season, type: :select
    filter :team_id, type: :select
    filter :game_type, type: :segmented, values: -> { Game::GAME_TYPES.keys }, default: :regular_season

    search_on(placeholder: "Search players") do |scope, term|
      normalized = Player.normalize_name(term)
      normalized.blank? ? scope : scope.where("players.normalized_name LIKE ?", "%#{normalized}%")
    end
  end

  def initialize(params)
    @params = params
  end

  attr_reader :params

  def rows
    records.map { |record| row_for(record) }
  end

  def meta
    pagination_meta(filtered_scope).merge(league: league.slug, season: season.label, game_type: game_type_key)
  end

  def schema
    {
      columns: self.class.columns_schema,
      filters: self.class.filters_schema.map { |entry| filter_schema_entry(entry) },
      search: self.class.search_schema,
      sort: self.class.sort_schema
    }
  end

  def league
    @league ||= League.find_by(slug: params[:league].presence || "nhl") || raise(NotFound, "League not found")
  end

  def season
    @season ||= resolve_season
  end

  private

  def resolve_season
    return default_season if params[:season].blank?

    league.seasons.find_by(label: params[:season]) || raise(NotFound, "Season not found")
  end

  # The newest season that actually has stats — the very newest season row is usually
  # seeded ahead of a sync, so defaulting to it would open on an empty table.
  def default_season
    league.seasons.where(id: stat_model.select(:season_id)).chronological.last ||
      league.seasons.current.first ||
      league.seasons.chronological.last ||
      raise(NotFound, "Season not found")
  end

  def game_type_key
    filter_value(:game_type)
  end

  def game_type_value
    Game::GAME_TYPES.fetch(game_type_key.to_sym)
  end

  def records
    @records ||= paginate(apply_sort(filtered_scope)).to_a
  end

  def filtered_scope
    @filtered_scope ||= apply_search(apply_filters(base_scope))
  end

  def base_scope
    scope = stat_model
              .select(outer_select_sql)
              .from(Arel.sql("(#{aggregate_relation.to_sql}) stats"))
              .joins("INNER JOIN players ON players.id = stats.player_id")

    return scope unless advanced?

    scope.joins("LEFT JOIN (#{advanced_relation.to_sql}) adv ON adv.player_id = stats.player_id")
  end

  def aggregate_relation
    scope = stat_model.where(season_id: season.id, game_type: game_type_value)
                      .where(team_id: league.teams.select(:id))
                      .group(:player_id)
                      .select(aggregate_select_sql)
    filter_value(:team_id).present? ? scope.where(team_id: filter_value(:team_id)) : scope
  end

  def aggregate_select_sql
    sums = self.class::SUM_COLUMNS.map { |column| "SUM(#{column}) AS #{column}" }
    ([ "player_id", "COUNT(DISTINCT team_id) AS team_count", "MIN(team_id) AS team_id" ] + sums).join(", ")
  end

  def outer_select_sql
    parts = [ "stats.*" ]
    parts.concat(self.class::ADVANCED_COLUMNS.map { |column| "adv.#{column}" }) if advanced?
    parts.concat(computed_select_sql)
    parts.join(", ")
  end

  def advanced_relation
    PlayerSeasonAdvancedStat
      .select("DISTINCT ON (player_id) player_id, #{self.class::ADVANCED_COLUMNS.join(', ')}")
      .where(season_id: season.id, game_type: game_type_value,
             strength_state: filter_value(:strength_state), score_state: filter_value(:score_state))
      .order("player_id, games_played DESC")
  end

  def row_for(record)
    row = { player: player_json(record), team: team_json(record) }

    self.class.column_definitions.each do |column|
      key = column[:key]
      next if %i[player team].include?(key)

      value = record[key.to_s]
      row[key] = value.nil? ? nil : cast(value, column[:format])
    end
    row
  end

  def cast(value, format)
    FLOAT_FORMATS.include?(format.to_s) ? value.to_f : value.to_i
  end

  def player_json(record)
    PlayerSerializer.new(players_by_id.fetch(record["player_id"].to_i)).as_json
  end

  def team_json(record)
    team = teams_by_id[record["team_id"].to_i]
    team && TeamSerializer.new(team).as_json
  end

  def players_by_id
    @players_by_id ||= Player.where(id: records.map { |record| record["player_id"] })
                             .includes(:external_ids).index_by(&:id)
  end

  def teams_by_id
    @teams_by_id ||= Team.where(id: records.filter_map { |record| record["team_id"] })
                         .with_logo.index_by(&:id)
  end

  # season's default is resolved per request (see #default_season), not declared, so the
  # frontend selector still opens on a real season.
  def filter_schema_entry(entry)
    resolved = entry.merge(options: filter_options(entry[:key]))
    resolved[:default] = season.label if entry[:key] == "season"
    resolved
  end

  def filter_options(key)
    case key
    when "league" then League.order(:tier).map { |league| { value: league.slug, label: league.name } }
    when "season" then league.seasons.chronological.reverse.map { |season| { value: season.label, label: season.label } }
    when "team_id" then league.teams.alphabetical.map { |team| { value: team.id, label: team.name } }
    when "game_type" then Game::GAME_TYPES.keys.map { |type| { value: type.to_s, label: type.to_s.humanize } }
    when "position" then self.class::POSITION_FILTER.map { |name| { value: name, label: name.humanize } }
    when "strength_state" then PlayerGameAdvancedStat::STRENGTH_STATES.values.map { |v| { value: v, label: STRENGTH_LABELS.fetch(v, v) } }
    when "score_state" then PlayerGameAdvancedStat::SCORE_STATES.values.map { |v| { value: v, label: v.humanize } }
    end
  end
end
