class SyncTeamScheduleJob < ApplicationJob
  queue_as :ingest

  def perform(team, season)
    sync = SyncTeamSchedule.new(team: team, season: season)
    games = sync.call

    Rails.logger.info("SyncTeamSchedule #{team.abbreviation} #{season.label}: #{games.size} games")
    Rails.logger.warn("SyncTeamSchedule #{team.abbreviation}: no team for #{sync.missing_teams.uniq.join(', ')}") if sync.missing_teams.any?
  end
end
