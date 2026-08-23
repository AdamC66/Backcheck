# AHL/ECHL rosters carry no NHL player id, so identity is name+birthdate against
# players we already know, falling back to a fresh Player when neither the external id
# nor that match resolves one. Overwrites nothing that's already set on an existing
# player — a second, less authoritative source shouldn't flip a name's spelling or
# clobber a position the NHL feed already recorded precisely.
class SyncAffiliateRoster
  class NoRosterAvailable < StandardError; end

  SOURCES = { "ahl" => "hockeytech_ahl", "echl" => "hockeytech_echl" }.freeze
  POSITION_CODES = { "C" => :center, "LW" => :left_wing, "RW" => :right_wing, "F" => :forward,
                      "D" => :defense, "G" => :goalie }.freeze
  STATUS_LEVELS = { "NHL" => :nhl, "AHL" => :ahl, "PTO" => :pto, "ATO" => :ato }.freeze
  # Two is normally enough — the newest season is empty until camp, the one before it
  # has a roster — with one spare in case a season closes out with nothing published.
  SEASON_PROBE_LIMIT = 3

  attr_reader :missing_players, :possible_duplicates

  def initialize(team:, client: HockeyTechClient.new(team.league.slug))
    @team = team
    @client = client
    @missing_players = []
    @possible_duplicates = []
  end

  def call
    season, roster = resolve_season_and_roster

    roster.select { |entry| entry.is_a?(Hash) }.filter_map { |entry| upsert(entry, season) }
  end

  private

  attr_reader :team, :client

  def league_slug
    team.league.slug
  end

  def source
    SOURCES.fetch(league_slug)
  end

  # The feed's own "current" season is empty pre-camp, so this tries the newest regular
  # season first and falls back to older ones until one actually has players — the same
  # shape as NHL "current", just resolved by probing instead of a redirect.
  def resolve_season_and_roster
    candidates = client.seasons.select { |s| s["career"] == "1" && s["playoff"] == "0" }
                        .sort_by { |s| s["start_date"] }.reverse.first(SEASON_PROBE_LIMIT)
    raise NoRosterAvailable, "no regular seasons published for #{league_slug}" if candidates.empty?

    ensure_hockeytech_team_id!(candidates.first.fetch("season_id").to_i)

    candidates.each do |candidate|
      season_id = candidate.fetch("season_id").to_i
      roster = client.roster(team_id: team.hockeytech_team_id, season_id: season_id)
      next if roster.none? { |entry| entry.is_a?(Hash) }

      return [ upsert_season(candidate, season_id), roster ]
    end

    raise NoRosterAvailable, "no non-empty roster in the last #{candidates.size} seasons for #{team.abbreviation}"
  end

  def ensure_hockeytech_team_id!(season_id)
    return if team.hockeytech_team_id.present?

    match = client.teams(season_id: season_id).find { |t| t.fetch("code") == team.abbreviation }
    return if match.blank?

    team.update!(hockeytech_team_id: match.fetch("id").to_i)
  end

  def upsert_season(candidate, season_id)
    season = Season.find_or_initialize_by(league: team.league, hockeytech_season_id: season_id)
    season.update!(
      label: candidate.fetch("shortname"),
      starts_on: candidate.fetch("start_date"),
      ends_on: candidate.fetch("end_date")
    )
    season
  end

  def upsert(entry, season)
    if entry["player_id"].blank? || entry["first_name"].blank? || entry["last_name"].blank?
      missing_players << (entry["name"] || entry["player_id"] || "unknown")
      return
    end

    player = match_or_create_player(entry)
    level, inferred = resolve_contract_level(entry, player, season)

    spot = RosterSpot.find_or_initialize_by(player: player, team: team, season: season)
    spot.update!(
      contract_level: RosterSpot::CONTRACT_LEVELS.fetch(level),
      contract_level_inferred: inferred,
      source: RosterSpot::SOURCES[:hockeytech],
      jersey_number: entry["tp_jersey_number"]
    )
    spot
  end

  def match_or_create_player(entry)
    external_id = entry.fetch("player_id").to_s
    linked = PlayerExternalId.find_by(source: source, external_id: external_id)&.player
    return update_player(linked, entry) if linked

    near_miss = nil
    existing = find_existing_player(entry) { |player| near_miss = player }
    player = update_player(existing || Player.new, entry)
    matched_by = existing ? PlayerExternalId::MATCHED_BY[:birthdate] : PlayerExternalId::MATCHED_BY[:exact]
    PlayerExternalId.create!(player: player, source: source, external_id: external_id, matched_by: matched_by)

    report_possible_duplicate(near_miss, player, entry) if near_miss

    player
  end

  def find_existing_player(entry)
    birth_date = entry["birthdate"]
    return if birth_date.blank?

    normalized_name = Player.normalize_name(entry.fetch("first_name"), entry.fetch("last_name"))
    match = Player.find_by(normalized_name: normalized_name, birth_date: birth_date)
    return match if match

    # Same name, disagreeing birthdate between sources — a real case, not hypothetical:
    # HockeyTech's own AHL and ECHL feeds have disagreed on a player's day and month.
    # Reported rather than linked, since guessing which source is right risks merging
    # two different people who happen to share a name.
    near_miss = Player.where(normalized_name: normalized_name).where.not(birth_date: nil).first
    yield near_miss if near_miss

    nil
  end

  # Persisted, not just logged, so an unresolved pair stays visible after the run that
  # found it ends — the same two players won't get a second row on a later rerun.
  def report_possible_duplicate(near_miss, player, entry)
    detail = "#{entry.fetch("name", player.normalized_name)}: #{player.birth_date} vs #{near_miss.birth_date}"
    possible_duplicates << detail

    player_a, player_b = [ near_miss, player ].sort_by(&:id)
    PossibleDuplicatePlayer.find_or_create_by!(player_a: player_a, player_b: player_b) { |d| d.detail = detail }
  end

  def update_player(player, entry)
    if player.new_record?
      player.first_name = entry.fetch("first_name")
      player.last_name = entry.fetch("last_name")
      player.birth_date = entry["birthdate"]
    end

    player.shoots_catches ||= entry["shoots"]
    player.position ||= resolve_position(entry["position"])
    player.assign_attributes(draft_attributes(entry, player))
    player.save!
    player
  end

  def resolve_position(code)
    Player::POSITIONS.fetch(POSITION_CODES.fetch(code, :forward), Player::POSITIONS[:forward])
  end

  # HockeyTech's own team id, not ours — resolved best-effort by name, since it's the
  # only handle a franchise carries across a relocation or an NHL-side rename.
  def draft_attributes(entry, player)
    return {} if player.draft_year.present?

    info = entry["draftinfo"]&.first
    return {} if info.blank? || info["draft_year"].blank?

    {
      draft_year: info["draft_year"], draft_round: info["draft_round"], draft_overall: info["draft_rank"],
      draft_team_name: info["draft_team"],
      draft_team: Team.joins(:league).find_by(leagues: { slug: "nhl" }, name: info["draft_team"])
    }
  end

  def resolve_contract_level(entry, player, season)
    status = entry["status"].presence
    return [ STATUS_LEVELS.fetch(status, :unknown), false ] if status

    [ inherited_ahl_contract_level(player, season) || :unknown, true ]
  end

  # The ECHL feed never reports status, so a two-way NHL contract playing there is only
  # visible by checking the same player's AHL spot for the overlapping season — the two
  # leagues key their own seasons independently, so this matches by date range, not id.
  def inherited_ahl_contract_level(player, season)
    spot = RosterSpot.joins(:season, team: :league)
                      .where(player: player, leagues: { slug: "ahl" })
                      .where("seasons.starts_on <= ? AND seasons.ends_on >= ?", season.ends_on, season.starts_on)
                      .first
    return if spot.blank?

    RosterSpot::CONTRACT_LEVELS.key(spot.contract_level)
  end
end
