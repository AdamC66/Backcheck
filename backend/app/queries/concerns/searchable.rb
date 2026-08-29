# Free-text search for a list query object. The query supplies a block that applies the
# `q` term to a scope; the concern owns param plumbing and the schema slice.
module Searchable
  extend ActiveSupport::Concern

  included do
    class_attribute :search_block
    class_attribute :search_placeholder, default: "Search"
  end

  class_methods do
    def search_on(placeholder: "Search", &block)
      self.search_block = block
      self.search_placeholder = placeholder
    end

    def search_schema
      return nil if search_block.nil?

      { param: "q", placeholder: search_placeholder }
    end
  end

  def apply_search(scope)
    term = params[:q].presence
    return scope if term.nil? || search_block.nil?

    instance_exec(scope, term, &search_block)
  end
end
