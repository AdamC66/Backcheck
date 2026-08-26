# Parses a game's shift-chart response into shifts rows. typeCode 517 rows are real
# shifts; the feed also mixes in typeCode 505 goal-marker rows (null duration, shiftNumber
# 0) that duplicate what play-by-play's own goal events already report — confirmed
# against a live response (see docs/DECISIONS.md), not assumed.
class UpsertShifts
  REAL_SHIFT_TYPE_CODE = 517

  # Unmatched playerIds skip their row rather than raising; callers report these so a
  # partial sync can't pass for a clean one.
  attr_reader :missing_players

  def initialize(game:, payload:)
    @game = game
    @payload = payload
    @missing_players = []
  end

  def call
    payload.select { |row| row["typeCode"] == REAL_SHIFT_TYPE_CODE }.filter_map { |row| upsert(row) }
  end

  private

  attr_reader :game, :payload

  def upsert(row)
    player = player_for(row.fetch("playerId"))
    return if player.nil?

    team = Team.find_by(nhl_team_id: row.fetch("teamId"))
    return if team.nil?

    shift = Shift.find_or_initialize_by(game: game, nhl_shift_id: row.fetch("id"))
    shift.update!(
      team: team,
      player: player,
      period: row.fetch("period"),
      start_time_seconds: parse_time(row["startTime"]),
      end_time_seconds: parse_time(row["endTime"])
    )
    shift
  end

  def player_for(nhl_player_id)
    player = Player.find_by(nhl_player_id: nhl_player_id)
    missing_players << nhl_player_id if player.nil?
    player
  end

  def parse_time(value)
    return 0 if value.blank?

    minutes, seconds = value.split(":").map(&:to_i)
    (minutes * 60) + seconds
  end
end
