module Api
  module V1
    module Admin
      class CoverageController < BaseController
        def index
          league = League.find_by(id: params[:league_id])
          return render_not_found("League not found") if league.nil?

          rows = LeagueCoverageMatrix.new(league: league).rows
          render_data(rows.map { |row| CoverageRowSerializer.new(row).as_json })
        end

        def gaps
          season = Season.find_by(id: params[:season_id])
          return render_not_found("Season not found") if season.nil?

          list = CoverageGapList.new(season: season, kind: params[:kind])
          render_data(list.rows, meta: { kind: list.kind })
        rescue CoverageGapList::UnknownKind
          render_error(code: "invalid_parameter", message: "Unknown coverage kind: #{params[:kind]}",
                       status: :unprocessable_content)
        end

        private

        def render_not_found(message)
          render_error(code: "not_found", message: message, status: :not_found)
        end
      end
    end
  end
end
