class League < ApplicationRecord
  has_many :teams, dependent: :restrict_with_error

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
end
