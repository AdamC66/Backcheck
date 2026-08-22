class Role < ApplicationRecord
  SCOPE_TYPES = %w[league team].freeze

  has_many :memberships, dependent: :restrict_with_error

  validates :key, presence: true, uniqueness: true
  validates :label, presence: true
  validates :scope_type, presence: true, inclusion: { in: SCOPE_TYPES }
end
