# Declarative, schema-describing filter params for a list query. A value outside a
# filter's allowed set is a 422 (InvalidFilter). Filters are validated here but applied
# by the query — most feed the base scope, so `apply_filters` only handles the ones
# declaring a `column:` or block.
module Filterable
  extend ActiveSupport::Concern

  class InvalidFilter < StandardError; end

  Definition = Struct.new(:key, :type, :label, :values, :default, :column, :apply, keyword_init: true) do
    def allowed
      values.respond_to?(:call) ? values.call.map(&:to_s) : values&.map(&:to_s)
    end
  end

  included do
    class_attribute :filter_definitions, default: {}
  end

  class_methods do
    def filter(key, type: :select, label: nil, values: nil, default: nil, column: nil, &apply)
      self.filter_definitions = filter_definitions.merge(
        key.to_s => Definition.new(key: key.to_s, type: type, column: column, apply: apply, values: values,
                                   default: default&.to_s, label: label || key.to_s.delete_suffix("_id").humanize)
      )
    end

    def filters_schema
      filter_definitions.values.map do |definition|
        entry = { key: definition.key, type: definition.type, label: definition.label }
        entry[:default] = definition.default if definition.default
        entry
      end
    end
  end

  def filter_value(key)
    definition = filter_definitions.fetch(key.to_s)
    raw = params[key].presence&.to_s || definition.default
    return raw if raw.nil? || definition.allowed.nil? || definition.allowed.include?(raw)

    raise InvalidFilter, "#{key} must be one of #{definition.allowed.join(', ')}"
  end

  def apply_filters(scope)
    filter_definitions.each_value do |definition|
      value = filter_value(definition.key)
      next if value.nil?

      scope = if definition.apply
        instance_exec(scope, value, &definition.apply)
      elsif definition.column
        scope.where(definition.column => value)
      else
        scope
      end
    end
    scope
  end
end
