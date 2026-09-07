# Loads ml/fit.py's JSON output into a new fitted XgTrainingRun, copying the CSV
# metadata from the matching `exported` run (by checksum) and enriching the held-out
# sample games with matchups and team abbreviations for the admin UI.
class ImportXgTrainingRun
  class Error < StandardError; end

  def initialize(path:)
    @path = Pathname(path)
  end

  def call
    raise Error, "no such file: #{path}" unless path.exist?

    fit = JSON.parse(path.read)
    export = XgTrainingRun.find_by(csv_sha256: fit["csv_sha256"], status: XgTrainingRun::STATUSES[:exported])
    raise Error, "no exported run matches csv_sha256 #{fit['csv_sha256']} — re-run rake xg:export_training_set" if export.nil?

    XgTrainingRun.create!(
      status: XgTrainingRun::STATUSES[:fitted],
      label: fit["label"],
      csv_path: export.csv_path,
      csv_sha256: export.csv_sha256,
      row_count: fit["trained_rows"] || export.row_count,
      goal_count: fit["trained_goals"] || export.goal_count,
      manifest: export.manifest,
      feature_set: fit["feature_set"],
      coefficients: fit["coefficients"],
      metrics: fit["metrics"],
      calibration: fit["calibration"],
      sample_games: enriched_sample_games(fit["sample_games"]),
      source_file: path.to_s
    )
  end

  private

  attr_reader :path

  def enriched_sample_games(rows)
    return [] if rows.blank?

    games = Game.where(id: rows.map { |row| row["game_id"] }.uniq).includes(:home_team, :away_team).index_by(&:id)
    teams = Team.where(id: rows.map { |row| row["team_id"] }.uniq).index_by(&:id)

    rows.map do |row|
      game = games[row["game_id"]]
      row.merge(
        "team" => teams[row["team_id"]]&.abbreviation,
        "matchup" => game && "#{game.away_team.abbreviation} @ #{game.home_team.abbreviation}"
      )
    end
  end
end
