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
  validate :player_is_on_the_team

  private

  def unit_number_within_range
    range = UNIT_NUMBER_RANGES[unit_type]
    return if range.blank?
    return if unit_number.present? && range.include?(unit_number)

    errors.add(:unit_number, "must be between #{range.first} and #{range.last} for a #{unit_type}")
  end

  # v1 eligibility is current team assignment only — a roster_spot for this team in the
  # game's season. The 23-man Active Roster / IR distinction (Article 16) is TASK-40.
  def player_is_on_the_team
    return if lineup.blank? || player_id.blank?

    on_team = RosterSpot.exists?(player_id: player_id, team_id: lineup.team_id, season_id: lineup.game.season_id)
    errors.add(:player, "is not on this team's roster for the season") unless on_team
  end
end
