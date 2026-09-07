class XgTrainingRunSerializer
  STATUS_NAMES = XgTrainingRun::STATUSES.invert.freeze

  def initialize(run)
    @run = run
  end

  def as_json(*)
    {
      id: run.id,
      status: STATUS_NAMES.fetch(run.status).to_s,
      label: run.label,
      row_count: run.row_count,
      goal_count: run.goal_count,
      csv_path: run.csv_path,
      csv_sha256: run.csv_sha256,
      manifest: run.manifest,
      feature_set: run.feature_set,
      coefficients: run.coefficients,
      metrics: run.metrics,
      calibration: run.calibration,
      sample_games: run.sample_games,
      notes: run.notes,
      source_file: run.source_file,
      xg_model_id: run.xg_model_id,
      created_at: run.created_at
    }
  end

  private

  attr_reader :run
end
