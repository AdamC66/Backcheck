# Parses one boxscore payload into skater_game_stats/goalie_game_stats rows. team_id
# comes from which side of the boxscore a player is listed under (game.home_team /
# game.away_team), not from roster_spots — a mid-season trade must never misattribute a
# game already played.
class UpsertGameStats
  # Unmatched playerIds skip their row rather than raising; callers report these so a
  # partial sync can't pass for a clean one.
  attr_reader :missing_players

  def initialize(game:, payload:)
    @game = game
    @payload = payload
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

  attr_reader :game, :payload

  def upsert_skater(team, row)
    player = player_for(row)
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
    player = player_for(row)
    return if player.nil?

    stat = GoalieGameStat.find_or_initialize_by(player: player, game: game)
    stat.update!(
      team: team,
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

  def player_for(row)
    nhl_player_id = row.fetch("playerId")
    player = Player.find_by(nhl_player_id: nhl_player_id)
    missing_players << nhl_player_id if player.nil?
    player
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
