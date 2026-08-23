# The org roster carries a real nhl_player_id on every entry, so unlike the AHL/ECHL
# sync there's no name matching here — a player either already exists by that id or is
# new to us. Contract level is always "nhl": this is the club's own roster.
class SyncTeamRoster
  class UnknownSeason < StandardError; end

  POSITION_CODES = { "C" => :center, "L" => :left_wing, "R" => :right_wing, "D" => :defense, "G" => :goalie }.freeze
  GROUPS = %w[forwards defensemen goalies].freeze

  def initialize(team:, client: NhlClient.new)
    @team = team
    @client = client
  end

  def call
    payload = client.roster(team.abbreviation)
    season = season_for(payload.fetch("season_id"))

    GROUPS.flat_map { |group| payload.fetch(group, []) }.map { |entry| upsert(entry, season) }
  end

  private

  attr_reader :team, :client

  def season_for(nhl_season_id)
    team.league.seasons.find_by(nhl_season_id: nhl_season_id) ||
      raise(UnknownSeason, "No season #{nhl_season_id} — run rake nhl:backfill[#{nhl_season_id}] first")
  end

  def upsert(entry, season)
    spot = RosterSpot.find_or_initialize_by(player: upsert_player(entry), team: team, season: season)
    spot.update!(
      contract_level: RosterSpot::CONTRACT_LEVELS[:nhl],
      contract_level_inferred: false,
      source: RosterSpot::SOURCES[:nhl_api],
      jersey_number: entry["sweaterNumber"]
    )
    spot
  end

  def upsert_player(entry)
    player = Player.find_or_initialize_by(nhl_player_id: entry.fetch("id"))
    player.update!(
      first_name: entry.dig("firstName", "default"),
      last_name: entry.dig("lastName", "default"),
      birth_date: entry["birthDate"],
      position: Player::POSITIONS.fetch(POSITION_CODES.fetch(entry.fetch("positionCode"))),
      shoots_catches: entry["shootsCatches"],
      height_in_inches: entry["heightInInches"],
      weight_in_pounds: entry["weightInPounds"],
      birth_city: entry.dig("birthCity", "default"),
      birth_country: entry["birthCountry"]
    )
    player
  end
end
