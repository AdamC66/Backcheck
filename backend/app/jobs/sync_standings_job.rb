class SyncStandingsJob < ApplicationJob
  # Every NHL request goes through this queue, which runs with concurrency 1 so the
  # client's interval is the real pace rather than one of several parallel paces.
  queue_as :ingest

  def perform(date = Date.yesterday)
    league = League.find_by!(slug: "nhl")
    sync = SyncStandings.new(league: league, date: date)
    standings = sync.call

    Rails.logger.info("SyncStandings #{date}: #{standings.size} teams")
    Rails.logger.warn("SyncStandings #{date}: no team for #{sync.missing_teams.join(', ')}") if sync.missing_teams.any?
  end
end
