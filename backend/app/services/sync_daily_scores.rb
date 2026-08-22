# The daily delta: refreshes score and state for one date's games. Cheaper than
# re-pulling a full schedule, and it's what keeps a live season current.
class SyncDailyScores
  attr_reader :missing_teams

  def initialize(league:, date:, client: NhlClient.new)
    @league = league
    @date = date
    @client = client
    @missing_teams = []
  end

  def call
    payload = client.scores_on(date)

    payload.fetch("games").filter_map { |game| upsert(game) }
  end

  private

  attr_reader :league, :date, :client

  def upsert(game)
    upsert = UpsertGame.new(league: league, payload: game)
    result = upsert.call
    missing_teams.concat(upsert.missing_teams)

    result
  end
end
