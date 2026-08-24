# Hand-rolled offset pagination, matching the in-house query-object style already used
# for game paging (see GameDatePage) rather than pulling in a pagination gem. Transaction
# history isn't date-bucketed for infinite scroll, so a plain page number fits.
class RosterStatusPage
  DEFAULT_PER_PAGE = 25
  MAX_PER_PAGE = 100

  def initialize(scope:, page: nil, per_page: nil)
    @scope = scope
    @page = page.present? ? [ page.to_i, 1 ].max : 1
    @per_page = (per_page.presence || DEFAULT_PER_PAGE).to_i.clamp(1, MAX_PER_PAGE)
  end

  def entries
    @entries ||= scope.offset((page - 1) * per_page).limit(per_page)
  end

  def total_count
    @total_count ||= scope.count
  end

  def total_pages
    return 0 if total_count.zero?

    (total_count.to_f / per_page).ceil
  end

  def meta
    { page: page, per_page: per_page, total_count: total_count, total_pages: total_pages }
  end

  private

  attr_reader :scope, :page, :per_page
end
