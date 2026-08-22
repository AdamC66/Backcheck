class Team < ApplicationRecord
  HEX_COLOR = /\A#\h{6}\z/

  belongs_to :league
  has_one_attached :logo

  scope :alphabetical, -> { order(:name) }
  scope :with_logo, -> { includes(logo_attachment: :blob) }

  validates :name, presence: true
  validates :abbreviation, presence: true, uniqueness: { scope: :league_id }
  validates :primary_color, :secondary_color, :tertiary_color,
            format: { with: HEX_COLOR }, allow_nil: true
end
