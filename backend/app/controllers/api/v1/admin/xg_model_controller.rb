module Api
  module V1
    module Admin
      class XgModelController < BaseController
        def show
          render_data({
            active_model: active_model_json,
            training_runs: XgTrainingRun.recent.map { |run| XgTrainingRunSerializer.new(run).as_json }
          })
        end

        private

        def active_model_json
          model = XgModel.active
          return nil if model.nil?

          {
            version: model.version,
            trained_at: model.trained_at,
            coefficients: model.coefficients,
            created_at: model.created_at
          }
        end
      end
    end
  end
end
