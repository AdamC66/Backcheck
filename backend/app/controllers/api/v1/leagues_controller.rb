module Api
  module V1
    class LeaguesController < BaseController
      def index
        leagues = League.visible_to(current_user).ranked.with_logo

        render_data(leagues.map { |league| LeagueSerializer.new(league).as_json })
      end

      # Missing, not forbidden: a 403 confirms the league exists.
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
