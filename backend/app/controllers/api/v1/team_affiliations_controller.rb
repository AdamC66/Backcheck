module Api
  module V1
    class TeamAffiliationsController < BaseController
      before_action :set_team, only: :index

      def index
        affiliations = TeamAffiliation.current_for(team)

        render_data(affiliations.includes(affiliate_team: [ :league, { logo_attachment: :blob } ])
                                 .map { |affiliation| TeamAffiliationSerializer.new(affiliation).as_json })
      end

      private

      attr_reader :team

      def set_team
        @team = Team.find_by(id: params[:team_id])

        render_error(code: "not_found", message: "Team not found", status: :not_found) if team.nil?
      end
    end
  end
end
