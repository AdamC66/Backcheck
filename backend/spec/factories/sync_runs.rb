FactoryBot.define do
  factory :sync_run do
    association :triggered_by, factory: :user, is_super_admin: true

    sync_kinds { [ SyncRun::SYNC_KINDS[:standings] ] }
    status { SyncRun::STATUSES[:queued] }
    min_interval { 1.0 }
  end
end
