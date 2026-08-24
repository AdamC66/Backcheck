class League < ApplicationRecord
  has_many :teams, dependent: :restrict_with_error
  has_many :seasons, dependent: :restrict_with_error
  has_one_attached :logo

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :abbreviation, presence: true, uniqueness: true
  validates :tier, presence: true, numericality: { only_integer: true, greater_than: 0 }

  scope :ranked, -> { order(:tier, :name) }
  scope :with_logo, -> { includes(logo_attachment: :blob) }
end
