class GameEvent < ApplicationRecord
  # missed_shot is a distinct type from shot (on goal) — without it, Fenwick (unblocked
  # attempts) can't be told apart from Corsi (all attempts). Added for TASK-72.
  EVENT_TYPES = { goal: 1, shot: 2, faceoff: 3, hit: 4, giveaway: 5, takeaway: 6, penalty: 7, blocked_shot: 8,
                  missed_shot: 9 }.freeze
  # between_legs confirmed against a live play-by-play response (TASK-74/75) — real data
  # has it, the original set didn't.
  SHOT_TYPES = { wrist: 1, slap: 2, snap: 3, backhand: 4, tip_in: 5, deflected: 6, wrap_around: 7, poke: 8,
                 between_legs: 9 }.freeze
  ZONES = { offensive: 1, defensive: 2, neutral: 3 }.freeze
  STRENGTH_STATES = { even_strength: 1, power_play: 2, short_handed: 3 }.freeze
  # Which side the home team's own net is on this period — real play-by-play data
  # carries this per event, and it's what lets xG normalize coordinates correctly
  # instead of assuming a fixed frame (see docs/DECISIONS.md, TASK-75).
  DEFENDING_SIDES = { left: "left", right: "right" }.freeze

  belongs_to :game
  belongs_to :team, optional: true
  belongs_to :primary_player, class_name: "Player", inverse_of: :primary_game_events
  belongs_to :secondary_player, class_name: "Player", optional: true, inverse_of: :secondary_game_events
  # A goal can carry two assists; secondary_player holds the first, this the second.
  belongs_to :tertiary_player, class_name: "Player", optional: true, inverse_of: :tertiary_game_events

  validates :nhl_event_id, presence: true, uniqueness: { scope: :game_id }
  validates :period, :period_time_seconds, presence: true
  validates :event_type, presence: true, inclusion: { in: EVENT_TYPES.values }
  validates :shot_type, inclusion: { in: SHOT_TYPES.values }, allow_nil: true
  validates :zone, inclusion: { in: ZONES.values }, allow_nil: true
  validates :strength_state, inclusion: { in: STRENGTH_STATES.values }, allow_nil: true
  validates :home_team_defending_side, inclusion: { in: DEFENDING_SIDES.values }, allow_nil: true
  validate :team_played_in_game

  private

  def team_played_in_game
    return if team.blank? || game.blank?
    return if [ game.home_team_id, game.away_team_id ].include?(team_id)

    errors.add(:team, "must be one of the game's two teams")
  end
end
