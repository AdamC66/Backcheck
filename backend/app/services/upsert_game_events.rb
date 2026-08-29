# Only the play types this schema models are stored — period-start/end, stoppage,
# delayed-penalty, and game-end are skipped. Confirmed live, not assumed (docs/DECISIONS.md).
class UpsertGameEvents
  TYPE_MAP = {
    "goal" => GameEvent::EVENT_TYPES[:goal],
    "shot-on-goal" => GameEvent::EVENT_TYPES[:shot],
    "missed-shot" => GameEvent::EVENT_TYPES[:missed_shot],
    "blocked-shot" => GameEvent::EVENT_TYPES[:blocked_shot],
    "faceoff" => GameEvent::EVENT_TYPES[:faceoff],
    "hit" => GameEvent::EVENT_TYPES[:hit],
    "giveaway" => GameEvent::EVENT_TYPES[:giveaway],
    "takeaway" => GameEvent::EVENT_TYPES[:takeaway],
    "penalty" => GameEvent::EVENT_TYPES[:penalty]
  }.freeze

  SHOT_TYPE_MAP = {
    "wrist" => GameEvent::SHOT_TYPES[:wrist],
    "slap" => GameEvent::SHOT_TYPES[:slap],
    "snap" => GameEvent::SHOT_TYPES[:snap],
    "backhand" => GameEvent::SHOT_TYPES[:backhand],
    "tip-in" => GameEvent::SHOT_TYPES[:tip_in],
    "deflected" => GameEvent::SHOT_TYPES[:deflected],
    "wrap-around" => GameEvent::SHOT_TYPES[:wrap_around],
    "poke" => GameEvent::SHOT_TYPES[:poke],
    "between-legs" => GameEvent::SHOT_TYPES[:between_legs]
  }.freeze

  ZONE_MAP = { "O" => GameEvent::ZONES[:offensive], "D" => GameEvent::ZONES[:defensive],
               "N" => GameEvent::ZONES[:neutral] }.freeze

  # Which JSON fields carry the primary/secondary/tertiary player for each type — a goal's
  # tertiary is its second assist, the only type that ever needs a third player.
  PLAYER_FIELDS = {
    "goal" => %w[scoringPlayerId assist1PlayerId assist2PlayerId],
    "shot-on-goal" => %w[shootingPlayerId],
    "missed-shot" => %w[shootingPlayerId],
    "blocked-shot" => %w[shootingPlayerId blockingPlayerId],
    "hit" => %w[hittingPlayerId hitteePlayerId],
    "giveaway" => %w[playerId],
    "takeaway" => %w[playerId],
    "penalty" => %w[committedByPlayerId drawnByPlayerId],
    "faceoff" => %w[winningPlayerId losingPlayerId]
  }.freeze

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
    bulk = BulkUpsert.new(model: GameEvent, unique_by: %i[game_id nhl_event_id])
    events = payload.fetch("plays").filter_map { |play| build_event(play) }.select { |event| bulk.add(event) }
    bulk.call
    @failures = bulk.failures
    events
  end

  private

  attr_reader :game, :payload

  def build_event(play)
    type_key = play["typeDescKey"]
    event_type = TYPE_MAP[type_key]
    return if event_type.nil?

    details = play.fetch("details", {})
    primary_id, secondary_id, tertiary_id = PLAYER_FIELDS.fetch(type_key, []).map { |field| details[field] }
    primary_player = player_for(primary_id)
    return if primary_player.nil?

    team = team_for(details["eventOwnerTeamId"])

    GameEvent.new(
      game: game, nhl_event_id: play.fetch("eventId"),
      period: play.dig("periodDescriptor", "number"),
      period_time_seconds: parse_time(play["timeInPeriod"]),
      event_type: event_type,
      shot_type: SHOT_TYPE_MAP[details["shotType"]],
      zone: ZONE_MAP[details["zoneCode"]],
      strength_state: strength_state_for(play["situationCode"], team),
      x_coord: details["xCoord"],
      y_coord: details["yCoord"],
      team: team,
      primary_player: primary_player,
      secondary_player: player_for(secondary_id),
      tertiary_player: player_for(tertiary_id),
      home_team_defending_side: play["homeTeamDefendingSide"]
    )
  end

  # Memoized per game — a game touches ~40 players/2 teams across hundreds of rows
  # (TASK-89), so re-querying per row was the sync pipeline's biggest single cost.
  def player_for(nhl_player_id)
    return nil if nhl_player_id.nil?
    return @players[nhl_player_id] if @players.key?(nhl_player_id)

    player = Player.find_by(nhl_player_id: nhl_player_id)
    missing_players << nhl_player_id if player.nil?
    @players[nhl_player_id] = player
  end

  def team_for(nhl_team_id)
    return nil if nhl_team_id.nil?
    return @teams[nhl_team_id] if @teams.key?(nhl_team_id)

    @teams[nhl_team_id] = Team.find_by(nhl_team_id: nhl_team_id)
  end

  # situationCode is [awayGoalieInNet][awaySkaters][homeSkaters][homeGoalieInNet] — the
  # team with more skaters than its opponent is on the power play, fewer is short-handed.
  def strength_state_for(situation_code, team)
    return nil if situation_code.blank? || team.nil?

    away_skaters = situation_code[1].to_i
    home_skaters = situation_code[2].to_i
    for_skaters, against_skaters = team.id == game.home_team_id ? [ home_skaters, away_skaters ] : [ away_skaters, home_skaters ]

    return GameEvent::STRENGTH_STATES[:even_strength] if for_skaters == against_skaters

    for_skaters > against_skaters ? GameEvent::STRENGTH_STATES[:power_play] : GameEvent::STRENGTH_STATES[:short_handed]
  end

  def parse_time(value)
    return 0 if value.blank?

    minutes, seconds = value.split(":").map(&:to_i)
    (minutes * 60) + seconds
  end
end
