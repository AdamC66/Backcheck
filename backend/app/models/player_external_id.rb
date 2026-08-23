class PlayerExternalId < ApplicationRecord
  SOURCES = [ "hockeytech_ahl", "hockeytech_echl" ].freeze
  MATCHED_BY = { exact: 1, birthdate: 2, manual: 3 }.freeze

  belongs_to :player

  validates :source, inclusion: { in: SOURCES }
  validates :external_id, presence: true, uniqueness: { scope: :source }
  validates :matched_by, inclusion: { in: MATCHED_BY.values }
end
