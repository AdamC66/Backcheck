class LineupSlot < ApplicationRecord
  # slot_order is a position index within the unit the serializer relies on:
  # forward_line 0/1/2 = LW/C/RW, defense_pair 0/1 = LD/RD; goalie unit_number 1 = starter.
  UNIT_TYPES = {
    forward_line: 0, defense_pair: 1, power_play: 2, penalty_kill: 3, goalie: 4, scratch: 5
  }.freeze

  UNIT_NUMBER_RANGES = {
    "forward_line" => 1..4, "defense_pair" => 1..4, "power_play" => 1..2,
    "penalty_kill" => 1..2, "goalie" => 1..2
  }.freeze

  belongs_to :lineup, inverse_of: :slots
  belongs_to :player

  enum :unit_type, UNIT_TYPES

  validates :player_id, uniqueness: { scope: [ :lineup_id, :unit_type ] }
  validates :unit_number, absence: true, if: :scratch?
  validate :unit_number_within_range, unless: :scratch?
  validate :player_is_eligible

  private

  def unit_number_within_range
    range = UNIT_NUMBER_RANGES[unit_type]
    return if range.blank?
    return if unit_number.present? && range.include?(unit_number)

    errors.add(:unit_number, "must be between #{range.first} and #{range.last} for a #{unit_type}")
  end

  # Season-grained, matching roster_spots itself: on this team's roster for the game's
  # season, and not currently on IR or non-roster (TASK-40). Still no 23-man Active
  # Roster max (Article 16) and no game-date precision — date-accurate history waits on
  # the participation backfill (TASK-157).
  def player_is_eligible
    return if lineup.blank? || player_id.blank?

    scope = { player_id: player_id, team_id: lineup.team_id, season_id: lineup.game.season_id }

    unless RosterSpot.exists?(scope)
      errors.add(:player, "is not on this team's roster for the season")
      return
    end

    errors.add(:player, "is on injured reserve or non-roster") if RosterStatus.open.exists?(scope)
  end
end
