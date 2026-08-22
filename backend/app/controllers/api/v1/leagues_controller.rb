module Api
  module V1
    class LeaguesController < BaseController
      def index
        leagues = League.visible_to(current_user).ranked.with_logo

        render_data(leagues.map { |league| LeagueSerializer.new(league).as_json })
      end

      # A league the user can't see is reported as missing rather than forbidden — a 403
      # would confirm it exists to someone with no business knowing that.
      def show
        league = League.visible_to(current_user).with_logo.find_by(slug: params[:slug])

        return render_not_found if league.nil?

        render_data(LeagueSerializer.new(league, include_teams: true).as_json)
      end

      private

      def render_not_found
        render_error(code: "not_found", message: "League not found", status: :not_found)
      end
    end
  end
end
