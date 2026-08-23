# A bare roster_spots row can't say where a player is actually playing — SyncTeamRoster
# always writes contract_level: nhl for the org roster, by design. This resolves, for
# each player, whether they also hold a spot on one of the team's affiliates for the
# same stretch of the calendar, batched into one query rather than one per player.
class TeamRoster
  def initialize(team:, season:)
    @team = team
    @season = season
  end

  def call
    spots = RosterSpot.where(team: team, season: season).includes(player: :external_ids).to_a
    assignments = affiliate_assignments_by_player_id

    spots.map { |spot| { roster_spot: spot, assignment: assignments[spot.player_id] } }
  end

  private

  attr_reader :team, :season

  def affiliate_team_ids
    @affiliate_team_ids ||= team.affiliations_as_parent.pluck(:affiliate_team_id)
  end

  # Ordered by league tier so a player conditioning-stinted from AHL to ECHL still shows
  # the AHL spot — the org relationship a loan doesn't erase — when both exist at once.
  def affiliate_assignments_by_player_id
    return {} if affiliate_team_ids.empty?

    RosterSpot.where(team_id: affiliate_team_ids)
              .joins(:season, team: :league)
              .where("seasons.starts_on <= ? AND seasons.ends_on >= ?", season.ends_on, season.starts_on)
              .order("leagues.tier")
              .includes(team: [ :league, { logo_attachment: :blob } ])
              .each_with_object({}) { |spot, memo| memo[spot.player_id] ||= spot }
  end
end
