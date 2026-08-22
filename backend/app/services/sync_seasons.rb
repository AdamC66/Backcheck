# /v1/standings-season is the only endpoint carrying a season's real start and end dates.
class SyncSeasons
  def initialize(league:, nhl_season_ids: nil, client: NhlClient.new)
    @league = league
    @nhl_season_ids = nhl_season_ids&.map(&:to_i)
    @client = client
  end

  def call
    entries.map { |entry| upsert(entry) }
  end

  private

  attr_reader :league, :nhl_season_ids, :client

  def entries
    payload = client.standings_season
    rows = payload.is_a?(Hash) ? payload.fetch("seasons") : payload

    return rows if nhl_season_ids.blank?

    rows.select { |row| nhl_season_ids.include?(row["id"]) }
  end

  def upsert(entry)
    season = league.seasons.find_or_initialize_by(nhl_season_id: entry.fetch("id"))

    season.update!(
      label: label_for(entry.fetch("id")),
      starts_on: entry.fetch("standingsStart"),
      ends_on: entry.fetch("standingsEnd")
    )

    season
  end

  def label_for(nhl_season_id)
    start_year = nhl_season_id / 10_000
    end_year = nhl_season_id % 10_000

    "#{start_year}-#{format('%02d', end_year % 100)}"
  end
end
