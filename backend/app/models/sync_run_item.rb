class SyncRunItem < ApplicationRecord
  belongs_to :sync_run
  belongs_to :team, optional: true

  validates :kind, inclusion: { in: SyncRun::SYNC_KINDS.values }
  validates :status, inclusion: { in: SyncRun::STATUSES.values }

  def kind_name
    SyncRun::SYNC_KINDS.key(kind)
  end
end
