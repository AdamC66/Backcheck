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
    statuses = open_roster_statuses_by_player_id

    spots.map do |spot|
      { roster_spot: spot, assignment: assignments[spot.player_id], roster_status: statuses[spot.player_id] }
    end
  end

  private

  attr_reader :team, :season

  def open_roster_statuses_by_player_id
    RosterStatus.open.where(team: team, season: season).index_by(&:player_id)
  end

  def affiliations
    @affiliations ||= TeamAffiliation.current_for(team)
  end

  # Ordered by league tier so a conditioning stint still shows the AHL spot. contract_level:
  # nhl on an affiliate row means "up with the parent club," not "here" — excluded so a
  # two-way player who's actually in the NHL doesn't read as sent down.
  def affiliate_assignments_by_player_id
    return {} if affiliations.empty?

    scopes = affiliations.filter_map do |affiliation|
      affiliate_season = affiliation.affiliate_team.league.seasons.overlapping(affiliation.season).chronological.last
      next if affiliate_season.nil?

      RosterSpot.where(team: affiliation.affiliate_team, season: affiliate_season)
                .where.not(contract_level: RosterSpot::CONTRACT_LEVELS[:nhl])
    end
    return {} if scopes.empty?

    scopes.reduce { |combined, scope| combined.or(scope) }
          .joins(team: :league)
          .order("leagues.tier")
          .includes(team: [ :league, { logo_attachment: :blob } ])
          .each_with_object({}) { |spot, memo| memo[spot.player_id] ||= spot }
  end
end
