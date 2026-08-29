# typeCode 517 rows are real shifts; 505 rows are goal-marker noise duplicating
# play-by-play's own goal events. Confirmed live, not assumed (docs/DECISIONS.md).
class UpsertShifts
  REAL_SHIFT_TYPE_CODE = 517

  # Unmatched playerIds and rows that fail validation once built (TASK-103's
  # BulkUpsert) skip rather than raise; callers report both instead.
  attr_reader :missing_players, :failures

  def initialize(game:, payload:)
    @game = game
    @payload = payload
    @missing_players = []
    @players = {}
    @teams = {}
  end

  def call
    bulk = BulkUpsert.new(model: Shift, unique_by: %i[game_id nhl_shift_id])
    shifts = payload.select { |row| row["typeCode"] == REAL_SHIFT_TYPE_CODE }
                    .filter_map { |row| build_shift(row) }.select { |shift| bulk.add(shift) }
    bulk.call
    @failures = bulk.failures
    shifts
  end

  private

  attr_reader :game, :payload

  def build_shift(row)
    player = player_for(row.fetch("playerId"))
    return if player.nil?

    team = team_for(row.fetch("teamId"))
    return if team.nil?

    Shift.new(
      game: game, nhl_shift_id: row.fetch("id"),
      team: team,
      player: player,
      period: row.fetch("period"),
      start_time_seconds: parse_time(row["startTime"]),
      end_time_seconds: parse_time(row["endTime"])
    )
  end

  # Memoized per game — a game's ~1,300 shift rows only touch ~40 players/2 teams
  # (TASK-89), so re-querying per row was the sync pipeline's biggest single cost.
  def player_for(nhl_player_id)
    return @players[nhl_player_id] if @players.key?(nhl_player_id)

    player = Player.find_by(nhl_player_id: nhl_player_id)
    missing_players << nhl_player_id if player.nil?
    @players[nhl_player_id] = player
  end

  def team_for(nhl_team_id)
    return @teams[nhl_team_id] if @teams.key?(nhl_team_id)

    @teams[nhl_team_id] = Team.find_by(nhl_team_id: nhl_team_id)
  end

  def parse_time(value)
    return 0 if value.blank?

    minutes, seconds = value.split(":").map(&:to_i)
    (minutes * 60) + seconds
  end
end
