class TeamSeasonAdvancedStat < ApplicationRecord
  belongs_to :team
  belongs_to :season

  validates :strength_state, presence: true, inclusion: { in: PlayerGameAdvancedStat::STRENGTH_STATES.values }
  validates :team_id, uniqueness: { scope: [ :season_id, :strength_state ] }
  validate :team_belongs_to_season_league

  private

  def team_belongs_to_season_league
    return if season.blank? || team.blank? || team.league_id == season.league_id

    errors.add(:team, "must belong to the same league as the season")
  end
end
