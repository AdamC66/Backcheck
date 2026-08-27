class RosterSpot < ApplicationRecord
  # Contract level, not roster status: it says whose paper a player is on, not whether
  # he is active or injured. Reported by the AHL feed, inherited for the ECHL.
  CONTRACT_LEVELS = { unknown: 0, nhl: 1, ahl: 2, echl: 3, pto: 4, ato: 5 }.freeze
  # inferred_from_stats: not a roster feed at all — a self-healed Player (TASK-56)
  # created from a boxscore row this player was never seen on a synced roster for.
  SOURCES = { nhl_api: 1, hockeytech: 2, manual: 3, inferred_from_stats: 4 }.freeze

  belongs_to :player
  belongs_to :team
  belongs_to :season

  validates :player_id, uniqueness: { scope: [ :team_id, :season_id ] }
  validates :contract_level, inclusion: { in: CONTRACT_LEVELS.values }
  validates :source, inclusion: { in: SOURCES.values }
  validate :team_belongs_to_season_league

  scope :for_season, ->(season) { where(season: season) }
  scope :for_team_season, ->(team, season) { where(team: team, season: season) }

  private

  # A Marlies spot belongs in an AHL season, not the NHL one the club feeds.
  def team_belongs_to_season_league
    return if season.blank? || team.blank? || team.league_id == season.league_id

    errors.add(:team, "must belong to the same league as the season")
  end
end
