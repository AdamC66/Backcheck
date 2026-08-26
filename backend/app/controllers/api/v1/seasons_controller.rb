module Api
  module V1
    class SeasonsController < BaseController
      def index
        league = League.find_by(slug: params[:league_slug])
        return render_not_found if league.nil?

        seasons = league.seasons.order(starts_on: :desc)
        render_data(seasons.map { |season| SeasonSerializer.new(season).as_json })
      end

      private

      def render_not_found
        render_error(code: "not_found", message: "League not found", status: :not_found)
      end
    end
  end
end
