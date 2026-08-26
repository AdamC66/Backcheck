class XgModel < ApplicationRecord
  validates :version, presence: true, uniqueness: true
  validates :coefficients, presence: true
  validates :trained_at, presence: true

  def self.active
    find_by(active: true)
  end

  def self.activate!(version)
    transaction do
      record = find_by!(version: version)
      where.not(id: record.id).update_all(active: false)
      record.update!(active: true)
      record
    end
  end
end
