FactoryBot.define do
  factory :sync_run_item do
    sync_run

    kind { SyncRun::SYNC_KINDS[:team_roster] }
    status { SyncRun::STATUSES[:queued] }
  end
end
