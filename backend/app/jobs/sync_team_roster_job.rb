class SyncTeamRosterJob < ApplicationJob
  queue_as :ingest

  def perform(team)
    spots = SyncTeamRoster.new(team: team).call

    Rails.logger.info("SyncTeamRoster #{team.abbreviation}: #{spots.size} spots")
  end
end
