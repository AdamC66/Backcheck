# Walked in id order with rounded floats so re-running against the same data yields a
# byte-identical file (TASK-140). Every column is a number or a controlled-vocabulary
# token, so rows need no CSV quoting.
class ExportXgTrainingSet
  FENWICK_EVENT_TYPES = GameEvent::FENWICK_EVENT_TYPES
  GOAL = GameEvent::EVENT_TYPES[:goal]
  COORD_PRECISION = 4

  COLUMNS = %i[
    game_id team_id season game_type event_id
    distance angle shot_type strength_state danger_zone rebound is_goal
  ].freeze

  def initialize(path:)
    @path = Pathname(path)
  end

  def call
    @path.dirname.mkpath
    row_count = 0
    goal_count = 0
    per_season = Hash.new { |hash, key| hash[key] = { "shots" => 0, "goals" => 0 } }

    @path.open("w") do |file|
      file.puts(COLUMNS.join(","))
      each_row do |row|
        file.puts(COLUMNS.map { |column| row.fetch(column) }.join(","))
        row_count += 1
        goal_count += 1 if row[:is_goal] == 1
        per_season[row[:season]]["shots"] += 1
        per_season[row[:season]]["goals"] += 1 if row[:is_goal] == 1
      end
    end

    XgTrainingRun.create!(
      status: XgTrainingRun::STATUSES[:exported],
      csv_path: @path.to_s,
      csv_sha256: Digest::SHA256.file(@path).hexdigest,
      row_count: row_count,
      goal_count: goal_count,
      manifest: {
        "feature_columns" => COLUMNS.map(&:to_s),
        "per_season" => per_season.sort.to_h,
        "rebound_window_seconds" => ReboundShots::REBOUND_WINDOW_SECONDS,
        "exported_at" => Time.current.iso8601
      }
    )
  end

  private

  attr_reader :path

  def each_row
    games.find_each do |game|
      rebounds = ReboundShots.new(game)

      fenwick_events(game).each do |event|
        next if shootout?(game, event)

        features = ShotFeatures.new(event: event, rebound: rebounds.rebound?(event))
        next unless features.present?

        yield({
          game_id: game.id,
          team_id: event.team_id,
          season: game.season.label,
          game_type: Game::GAME_TYPES.key(game.game_type).to_s,
          event_id: event.id,
          distance: features.distance.round(COORD_PRECISION),
          angle: features.angle.round(COORD_PRECISION),
          shot_type: features.shot_type_name,
          strength_state: features.strength_state_name,
          danger_zone: features.danger_zone.to_s,
          rebound: features.rebound? ? 1 : 0,
          is_goal: event.event_type == GOAL ? 1 : 0
        })
      end
    end
  end

  def games
    Game.where(id: GameEvent.where(event_type: FENWICK_EVENT_TYPES).select(:game_id))
        .includes(:season).order(:id)
  end

  # The game is already loaded, so set the association rather than let ShotFeatures'
  # event.target_net_x re-fetch it once per row.
  def fenwick_events(game)
    events = GameEvent.where(game: game, event_type: FENWICK_EVENT_TYPES).order(:id).to_a
    events.each { |event| event.association(:game).target = game }
    events
  end

  # A regular-season / preseason shootout is recorded as period 5; playoff period 5+
  # is real overtime. Shootout attempts have no rink context and are excluded.
  def shootout?(game, event)
    event.period >= 5 && game.game_type != Game::GAME_TYPES[:playoffs]
  end
end
