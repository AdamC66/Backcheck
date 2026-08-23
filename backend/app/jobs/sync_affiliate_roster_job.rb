class SyncAffiliateRosterJob < ApplicationJob
  queue_as :ingest

  def perform(team)
    sync = SyncAffiliateRoster.new(team: team)
    spots = sync.call

    Rails.logger.info("SyncAffiliateRoster #{team.abbreviation}: #{spots.size} spots")
    Rails.logger.warn("SyncAffiliateRoster #{team.abbreviation}: skipped #{sync.missing_players.join(', ')}") if sync.missing_players.any?
    if sync.possible_duplicates.any?
      Rails.logger.warn("SyncAffiliateRoster #{team.abbreviation}: possible duplicate players #{sync.possible_duplicates.join('; ')}")
    end
  end
end
