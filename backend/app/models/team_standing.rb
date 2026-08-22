class TeamStanding < ApplicationRecord
  belongs_to :team
  belongs_to :season

  validates :as_of_date, presence: true
  validates :games_played, :wins, :losses, :ot_losses, :points, presence: true
  validates :as_of_date, uniqueness: { scope: [ :team_id, :season_id ] }
  validate :team_belongs_to_season_league

  scope :on_date, ->(date) { where(as_of_date: date) }
  scope :ranked, -> { order(:league_sequence) }

  # The most recent snapshot per team, for a season that may have hundreds of them.
  scope :latest_for_season, ->(season) {
    where(season: season)
      .where(as_of_date: where(season: season).select("MAX(as_of_date)"))
  }

  private

  def team_belongs_to_season_league
    return if season.blank? || team.blank? || team.league_id == season.league_id

    errors.add(:team, "must belong to the same league as the season")
  end
end
