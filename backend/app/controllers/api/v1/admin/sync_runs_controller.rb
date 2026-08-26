module Api
  module V1
    module Admin
      class SyncRunsController < BaseController
        before_action :set_sync_run, only: [ :show, :cancel ]

        def index
          runs = SyncRun.order(created_at: :desc).limit(50)

          render_data(runs.map { |run| SyncRunSerializer.new(run).as_json }, meta: { counts: status_counts })
        end

        def show
          render_data(SyncRunSerializer.new(sync_run, include_items: true, include_log: true).as_json)
        end

        def create
          result = CreateSyncRun.new(
            triggered_by: current_user,
            sync_kinds: params[:sync_kinds],
            league: League.find_by(id: params[:league_id]),
            season: Season.find_by(id: params[:season_id]),
            team: Team.find_by(id: params[:team_id]),
            min_interval_preset: params[:min_interval_preset]
          ).call

          return render_invalid(result.errors) unless result.success?

          render_data(SyncRunSerializer.new(result.result).as_json, status: :created)
        end

        def cancel
          return render_already_finished unless cancellable?

          sync_run.update!(status: SyncRun::STATUSES[:cancelled])

          render_data(SyncRunSerializer.new(sync_run).as_json)
        end

        private

        attr_reader :sync_run

        def set_sync_run
          @sync_run = SyncRun.find_by(id: params[:id])

          render_not_found if sync_run.nil?
        end

        def cancellable?
          [ SyncRun::STATUSES[:queued], SyncRun::STATUSES[:running] ].include?(sync_run.status)
        end

        def status_counts
          raw = SyncRun.group(:status).count
          SyncRun::STATUSES.each_with_object({}) { |(name, value), counts| counts[name] = raw.fetch(value, 0) }
        end

        def render_not_found
          render_error(code: "not_found", message: "Sync run not found", status: :not_found)
        end

        def render_already_finished
          render_error(code: "invalid_state", message: "Sync run has already finished", status: :unprocessable_content)
        end

        def render_invalid(errors)
          render_error(code: "invalid_parameter", message: errors.join(", "), status: :unprocessable_content)
        end
      end
    end
  end
end
