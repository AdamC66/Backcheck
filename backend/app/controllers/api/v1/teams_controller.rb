module Api
  module V1
    class TeamsController < BaseController
      before_action :set_team

      def show
        render_data(TeamSerializer.new(team).as_json)
      end

      private

      attr_reader :team

      # Missing, not forbidden — same reasoning as the leagues controller.
      def set_team
        @team = Team.find_by(id: params[:id] || params[:team_id])

        render_not_found if team.nil? || !current_user.authorized_for_team?(team)
      end

      def render_not_found
        render_error(code: "not_found", message: "Team not found", status: :not_found)
      end
    end
  end
end
