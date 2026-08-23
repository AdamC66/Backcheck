# Pages games by whole dates rather than by row: it walks dates outward from an anchor,
# taking each one entirely, until it has at least `limit` games. A date is never split
# across pages, so a client can group by date without worrying that it has half a day.
class GameDatePage
  DEFAULT_LIMIT = 25
  MAX_LIMIT = 100
  DIRECTIONS = %w[forward backward].freeze

  def initialize(scope:, anchor:, direction: "forward", limit: DEFAULT_LIMIT)
    @scope = scope
    @anchor = anchor
    @direction = direction
    @limit = (limit || DEFAULT_LIMIT).clamp(1, MAX_LIMIT)
  end

  def dates
    @dates ||= begin
      taken = []
      total = 0

      # The first date is always taken whole, even when it alone exceeds the limit.
      counts.each do |date, count|
        break if total >= limit

        taken << date
        total += count
      end

      taken.sort
    end
  end

  def games
    return scope.none if dates.empty?

    scope.where(game_date: dates).chronological
  end

  def prev_cursor
    scope.where(game_date: ...(dates.first || anchor)).maximum(:game_date)
  end

  def next_cursor
    scope.where(game_date: ((dates.last || anchor) + 1)..).minimum(:game_date)
  end

  private

  attr_reader :scope, :anchor, :direction, :limit

  def forward?
    direction != "backward"
  end

  def counts
    reachable = forward? ? scope.where(game_date: anchor..) : scope.where(game_date: ..anchor)
    by_date = reachable.group(:game_date).count.sort

    forward? ? by_date : by_date.reverse
  end
end
