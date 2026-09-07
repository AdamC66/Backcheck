# Promotes a fitted XgTrainingRun to a new XgModel and swaps it in atomically
# (XgModel.activate!, TASK-59). Coefficients come straight off the run — never
# hand-transcribed. Historical advanced-stat rows are not touched here; they carry the
# model that produced them until the TASK-145 backfill runs.
class ActivateXgModel
  class Error < StandardError; end

  def initialize(label:, version: nil)
    @label = label
    @version = version
  end

  def call
    run = XgTrainingRun.where(label: label, status: XgTrainingRun::STATUSES[:fitted]).order(:id).last
    raise Error, "no fitted training run labelled #{label.inspect}" if run.nil?
    raise Error, "training run ##{run.id} has no coefficients" if run.coefficients.blank?

    resolved_version = version.presence || label

    XgModel.transaction do
      model = XgModel.create!(version: resolved_version, coefficients: run.coefficients,
                              trained_at: run.created_at)
      model = XgModel.activate!(model.version)
      run.update!(status: XgTrainingRun::STATUSES[:promoted], xg_model: model)
      model
    end
  end

  private

  attr_reader :label, :version
end
