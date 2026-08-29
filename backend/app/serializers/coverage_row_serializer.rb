class CoverageRowSerializer
  def initialize(row)
    @row = row
  end

  def as_json(*)
    @row.to_h.transform_values { |value| value.is_a?(LeagueCoverageMatrix::Cell) ? value.to_h : value }
  end
end
