# Offset pagination for a list query object — hand-rolled to match the in-house style
# (RosterStatusPage), not a gem. `pagination_meta` is the standard list-envelope meta.
module Paginated
  extend ActiveSupport::Concern

  DEFAULT_PER_PAGE = 25
  MAX_PER_PAGE = 100

  def page
    @page ||= [ params[:page].to_i, 1 ].max
  end

  def per_page
    @per_page ||= (params[:per_page].presence || DEFAULT_PER_PAGE).to_i.clamp(1, MAX_PER_PAGE)
  end

  def paginate(scope)
    scope.offset((page - 1) * per_page).limit(per_page)
  end

  def pagination_meta(scope)
    total = scope.except(:select, :order, :limit, :offset).count
    { page: page, per_page: per_page, total_count: total, total_pages: total.zero? ? 0 : (total.to_f / per_page).ceil }
  end
end
