# Bridges a searchable-table query object to a controller: one action renders rows +
# pagination meta, one renders the schema the frontend builds its UI from.
module TableEndpoint
  extend ActiveSupport::Concern

  included do
    rescue_from Sortable::InvalidSort, Filterable::InvalidFilter, with: :render_invalid_table_param
    rescue_from PlayerStatSearch::NotFound, with: :render_table_not_found
  end

  private

  def render_table(query)
    render_data(query.rows, meta: query.meta)
  end

  def render_schema(query)
    render_data(query.schema)
  end

  def render_invalid_table_param(error)
    render_error(code: "invalid_parameter", message: error.message, status: :unprocessable_content)
  end

  def render_table_not_found(error)
    render_error(code: "not_found", message: error.message, status: :not_found)
  end
end
