class PossibleDuplicatePlayer < ApplicationRecord
  belongs_to :player_a, class_name: "Player"
  belongs_to :player_b, class_name: "Player"

  validates :detail, presence: true
  validate :ordered_by_id

  scope :unresolved, -> { where(resolved_at: nil) }

  private

  # A defensive backstop, not the only guard — SyncAffiliateRoster is what actually
  # orders the pair before writing, this just refuses to save it wrong.
  def ordered_by_id
    return if player_a_id.blank? || player_b_id.blank? || player_a_id < player_b_id

    errors.add(:player_a_id, "must be the lower id of the pair")
  end
end
