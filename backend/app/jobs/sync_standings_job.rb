class SyncStandingsJob < ApplicationJob
  # The ingest queue runs one job at a time; that's what makes the client's interval real.
  queue_as :ingest

  def perform(date = Date.yesterday)
    league = League.find_by!(slug: "nhl")
    sync = SyncStandings.new(league: league, date: date)
    standings = sync.call

    Rails.logger.info("SyncStandings #{date}: #{standings.size} teams")
    Rails.logger.warn("SyncStandings #{date}: no team for #{sync.missing_teams.join(', ')}") if sync.missing_teams.any?
  end
end
