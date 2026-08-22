class SyncDailyScoresJob < ApplicationJob
  queue_as :ingest

  # Yesterday, so every game from that date has finished and been finalized upstream.
  def perform(date = Date.yesterday)
    league = League.find_by!(slug: "nhl")
    sync = SyncDailyScores.new(league: league, date: date)
    games = sync.call

    Rails.logger.info("SyncDailyScores #{date}: #{games.size} games")
    Rails.logger.warn("SyncDailyScores #{date}: no team for #{sync.missing_teams.uniq.join(', ')}") if sync.missing_teams.any?
  end
end
