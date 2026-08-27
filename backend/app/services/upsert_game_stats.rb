# team_id comes from which side of the boxscore a player is listed under, not from
# roster_spots — a mid-season trade must never misattribute a game already played.
class UpsertGameStats
  # Same NHL-API position codes SyncTeamRoster uses — duplicated rather than shared,
  # same as NhlStatsClient/HockeyTechClient (see docs/DECISIONS.md).
  POSITION_CODES = { "C" => :center, "L" => :left_wing, "R" => :right_wing, "D" => :defense, "G" => :goalie }.freeze

  # A playerId only ends up here if NhlClient#player_landing itself couldn't resolve
  # it (e.g. a 404); anyone self-healed via a live landing lookup doesn't count as missing.
  attr_reader :missing_players

  def initialize(game:, payload:, client:)
    @game = game
    @payload = payload
    @client = client
    @missing_players = []
  end

  def call
    sides = payload.fetch("playerByGameStats")

    [ [ "awayTeam", game.away_team ], [ "homeTeam", game.home_team ] ].flat_map do |key, team|
      side = sides.fetch(key, {})
      skaters = (side.fetch("forwards", []) + side.fetch("defense", [])).filter_map { |row| upsert_skater(team, row) }
      goalies = side.fetch("goalies", []).filter_map { |row| upsert_goalie(team, row) }
      skaters + goalies
    end
  end

  private

  attr_reader :game, :payload, :client

  def upsert_skater(team, row)
    player = player_for(row, team)
    return if player.nil?

    stat = SkaterGameStat.find_or_initialize_by(player: player, game: game)
    stat.update!(
      team: team,
      goals: row.fetch("goals", 0),
      assists: row.fetch("assists", 0),
      points: row.fetch("points", 0),
      plus_minus: row.fetch("plusMinus", 0),
      pim: row.fetch("pim", 0),
      hits: row.fetch("hits", 0),
      power_play_goals: row.fetch("powerPlayGoals", 0),
      shots_on_goal: row.fetch("sog", 0),
      faceoff_winning_pctg: row["faceoffWinningPctg"],
      time_on_ice_seconds: parse_toi(row["toi"]),
      shifts: row.fetch("shifts", 0),
      blocked_shots: row.fetch("blockedShots", 0),
      giveaways: row.fetch("giveaways", 0),
      takeaways: row.fetch("takeaways", 0)
    )
    stat
  end

  def upsert_goalie(team, row)
    player = player_for(row, team)
    return if player.nil?

    stat = GoalieGameStat.find_or_initialize_by(player: player, game: game)
    points = GoalieGamePoints.new(game: game, player: player)
    stat.update!(
      team: team,
      goals: points.goals,
      assists: points.assists,
      even_strength_shots_against: shots_against(row["evenStrengthShotsAgainst"]),
      even_strength_goals_against: row.fetch("evenStrengthGoalsAgainst", 0),
      power_play_shots_against: shots_against(row["powerPlayShotsAgainst"]),
      power_play_goals_against: row.fetch("powerPlayGoalsAgainst", 0),
      shorthanded_shots_against: shots_against(row["shorthandedShotsAgainst"]),
      shorthanded_goals_against: row.fetch("shorthandedGoalsAgainst", 0),
      shots_against: row.fetch("shotsAgainst", 0),
      saves: row.fetch("saves", 0),
      goals_against: row.fetch("goalsAgainst", 0),
      pim: row.fetch("pim", 0),
      time_on_ice_seconds: parse_toi(row["toi"]),
      starter: row.fetch("starter", false),
      decision: row["decision"]
    )
    stat
  end

  def player_for(row, team)
    nhl_player_id = row.fetch("playerId")
    Player.find_by(nhl_player_id: nhl_player_id) || self_heal(nhl_player_id, team)
  end

  # A player who's since left every team's current roster (SyncTeamRoster only ever
  # syncs the present-tense one) is otherwise permanently unmatchable — see TASK-56.
  def self_heal(nhl_player_id, team)
    player = upsert_player_from_landing(client.player_landing(nhl_player_id))
    upsert_inferred_roster_spot(player, team)
    player
  rescue NhlClient::NotFound
    missing_players << nhl_player_id
    nil
  end

  def upsert_player_from_landing(data)
    player = Player.find_or_initialize_by(nhl_player_id: data.fetch("playerId"))
    player.update!(
      first_name: data.dig("firstName", "default"),
      last_name: data.dig("lastName", "default"),
      birth_date: data["birthDate"],
      position: Player::POSITIONS.fetch(POSITION_CODES.fetch(data.fetch("position"))),
      shoots_catches: data["shootsCatches"],
      height_in_inches: data["heightInInches"],
      weight_in_pounds: data["weightInPounds"],
      birth_city: data.dig("birthCity", "default"),
      birth_country: data["birthCountry"]
    )
    player
  end

  def upsert_inferred_roster_spot(player, team)
    RosterSpot.find_or_initialize_by(player: player, team: team, season: game.season).update!(
      contract_level: RosterSpot::CONTRACT_LEVELS[:unknown],
      contract_level_inferred: true,
      source: RosterSpot::SOURCES[:inferred_from_stats]
    )
  end

  def parse_toi(value)
    return 0 if value.blank?

    minutes, seconds = value.split(":").map(&:to_i)
    (minutes * 60) + seconds
  end

  # The boxscore reports strength splits as "saves/shots" (e.g. "42/43") — only the
  # attempt count is stored here, since saves is derivable and already tracked as a total.
  def shots_against(value)
    return 0 if value.blank?

    value.split("/").last.to_i
  end
end
