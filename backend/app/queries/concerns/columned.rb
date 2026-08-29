# The display columns a list query returns, declared once so the schema endpoint and the
# row projection can't drift. `format` is a token the frontend formatter registry
# implements (int, decimal1, decimal2, pct3, toi, plus_minus, text).
module Columned
  extend ActiveSupport::Concern

  included do
    class_attribute :column_definitions, default: []
  end

  class_methods do
    def columns(definitions)
      self.column_definitions = definitions.map do |definition|
        { sortable: true, group: "stats" }.merge(definition).transform_keys(&:to_sym)
      end

      # One list is the source of truth: a sortable column's ORDER BY expression is its
      # own key unless it declares `sort:`, so the two can't disagree.
      return unless respond_to?(:sortable)

      sortable(column_definitions.select { |c| c[:sortable] }
                                 .to_h { |c| [ c[:key], c[:sort] || c[:key].to_s ] })
    end

    def columns_schema
      column_definitions.map do |column|
        { key: column[:key].to_s, label: column[:label], title: column[:title] || column[:label],
          format: column[:format].to_s, sortable: column[:sortable], group: column[:group].to_s }
      end
    end
  end
end
