class TeamAffiliation < ApplicationRecord
  belongs_to :parent_team, class_name: "Team"
  belongs_to :affiliate_team, class_name: "Team"
  belongs_to :season

  validates :affiliate_team_id, uniqueness: { scope: :season_id }
  validate :affiliate_is_a_lower_tier
  validate :season_belongs_to_parent_league

  scope :for_season, ->(season) { where(season: season) }

  # Newest season this team actually has an affiliation row for, not the league's
  # newest season row — those can drift apart after a backfill.
  def self.current_for(parent_team)
    season = parent_team.league.seasons.where(id: where(parent_team: parent_team).select(:season_id))
                         .chronological.last
    return none if season.nil?

    for_season(season).where(parent_team: parent_team)
  end

  private

  def affiliate_is_a_lower_tier
    return if parent_team.blank? || affiliate_team.blank?
    return if affiliate_team.league.tier > parent_team.league.tier

    errors.add(:affiliate_team, "must be in a lower tier league than the parent team")
  end

  # Keeps the season anchored to the parent side — an AHL club's own season isn't a
  # good fit, since the affiliation itself belongs to the NHL team's year.
  def season_belongs_to_parent_league
    return if season.blank? || parent_team.blank? || season.league_id == parent_team.league_id

    errors.add(:season, "must belong to the parent team's league")
  end
end
