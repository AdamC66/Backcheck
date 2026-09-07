class GameEvent < ApplicationRecord
  EVENT_TYPES = { goal: 1, shot: 2, faceoff: 3, hit: 4, giveaway: 5, takeaway: 6, penalty: 7, blocked_shot: 8,
                  missed_shot: 9 }.freeze
  SHOT_TYPES = { wrist: 1, slap: 2, snap: 3, backhand: 4, tip_in: 5, deflected: 6, wrap_around: 7, poke: 8,
                 between_legs: 9 }.freeze
  ZONES = { offensive: 1, defensive: 2, neutral: 3 }.freeze
  STRENGTH_STATES = { even_strength: 1, power_play: 2, short_handed: 3 }.freeze
  DEFENDING_SIDES = { left: "left", right: "right" }.freeze
  PENALTY_TYPES = { minor: "minor", major: "major", bench_minor: "bench-minor", misconduct: "misconduct",
                    game_misconduct: "game-misconduct", match: "match", penalty_shot: "penalty-shot" }.freeze

  # Shot attempts: Fenwick is unblocked (never blocked_shot — its coordinates are the
  # blocker's position, not the release point), Corsi adds blocked shots.
  FENWICK_EVENT_TYPES = EVENT_TYPES.values_at(:goal, :shot, :missed_shot).freeze
  CORSI_EVENT_TYPES = (FENWICK_EVENT_TYPES + [ EVENT_TYPES[:blocked_shot] ]).freeze

  belongs_to :game
  belongs_to :team, optional: true
  belongs_to :primary_player, class_name: "Player", inverse_of: :primary_game_events
  belongs_to :secondary_player, class_name: "Player", optional: true, inverse_of: :secondary_game_events
  belongs_to :tertiary_player, class_name: "Player", optional: true, inverse_of: :tertiary_game_events

  validates :nhl_event_id, presence: true, uniqueness: { scope: :game_id, on: %i[create update] }
  validates :period, :period_time_seconds, presence: true
  validates :event_type, presence: true, inclusion: { in: EVENT_TYPES.values }
  validates :shot_type, inclusion: { in: SHOT_TYPES.values }, allow_nil: true
  validates :zone, inclusion: { in: ZONES.values }, allow_nil: true
  validates :strength_state, inclusion: { in: STRENGTH_STATES.values }, allow_nil: true
  validates :home_team_defending_side, inclusion: { in: DEFENDING_SIDES.values }, allow_nil: true
  validates :penalty_type, inclusion: { in: PENALTY_TYPES.values }, allow_nil: true
  validates :penalty_minutes, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validate :team_played_in_game

  def target_net_x
    return nil if home_team_defending_side.blank? || team_id.nil?

    home_net_x = home_team_defending_side == DEFENDING_SIDES[:left] ? -ShotGeometry::HALF_RINK_X : ShotGeometry::HALF_RINK_X
    team_id == game.home_team_id ? -home_net_x : home_net_x
  end

  private

  def team_played_in_game
    return if team.blank? || game.blank?
    return if [ game.home_team_id, game.away_team_id ].include?(team_id)

    errors.add(:team, "must be one of the game's two teams")
  end
end
