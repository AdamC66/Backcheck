# Declarative sort allowlist for a list query object. `sortable` maps a public key to a
# SQL expression we control; a client key not in the map is a 422 (InvalidSort), never
# interpolated into ORDER BY.
module Sortable
  extend ActiveSupport::Concern

  class InvalidSort < StandardError; end

  DIRECTIONS = %w[asc desc].freeze

  included do
    class_attribute :sort_expressions, default: {}
    class_attribute :default_sort_spec, default: { key: nil, direction: "desc" }
  end

  class_methods do
    def sortable(map)
      self.sort_expressions = map.transform_keys(&:to_s)
    end

    def default_sort(key, direction = :desc)
      self.default_sort_spec = { key: key.to_s, direction: direction.to_s }
    end

    def sort_schema
      { sortable: sort_expressions.keys, default: default_sort_spec }
    end
  end

  def sort_key
    requested = params[:sort].presence
    return default_sort_spec.fetch(:key) if requested.nil?
    raise InvalidSort, "unknown sort column: #{requested}" unless sort_expressions.key?(requested)

    requested
  end

  def sort_direction
    requested = params[:dir].presence&.downcase
    return default_sort_spec.fetch(:direction) if requested.nil?
    raise InvalidSort, "sort direction must be asc or desc" unless DIRECTIONS.include?(requested)

    requested
  end

  # A fixed name/id tiebreak keeps pagination stable when the sort column ties.
  def apply_sort(scope)
    primary = "#{sort_expressions.fetch(sort_key)} #{sort_direction.upcase} NULLS LAST"
    scope.order(Arel.sql("#{primary}, players.last_name ASC, players.id ASC"))
  end
end
