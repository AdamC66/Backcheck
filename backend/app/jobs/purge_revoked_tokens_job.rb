class PurgeRevokedTokensJob < ApplicationJob
  queue_as :default

  def perform
    RevokedToken.purge_expired!
  end
end
