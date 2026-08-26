class SeasonSerializer
  def initialize(season)
    @season = season
  end

  def as_json(*)
    {
      id: season.id,
      label: season.label,
      starts_on: season.starts_on,
      ends_on: season.ends_on
    }
  end

  private

  attr_reader :season
end
