class XgTrainingRun < ApplicationRecord
  STATUSES = { exported: 0, fitted: 1, promoted: 2 }.freeze

  belongs_to :xg_model, optional: true

  validates :status, inclusion: { in: STATUSES.values }
  validates :csv_path, :csv_sha256, presence: true
  validates :row_count, :goal_count,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :recent, -> { order(created_at: :desc) }

  def status_name
    STATUSES.key(status)
  end
end
