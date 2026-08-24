module Api
  module V1
    class ReassignmentsController < BaseController
      before_action :set_team, only: :update
      before_action :authorize_gm!, only: :update
      before_action :set_roster_spot_and_destination, only: :update

      def update
        result = ReassignPlayer.new(roster_spot: roster_spot, destination_team: destination_team,
                                     destination_season: destination_season).call

        return render_invalid(result.errors) unless result.success?

        render_data({ team: TeamSerializer.new(destination_team, include_league: true).as_json }
                      .merge(RosterSpotSerializer.new(result.result).as_json))
      end

      private

      attr_reader :team, :roster_spot, :destination_team, :destination_season

      def set_team
        @team = Team.find_by(id: params[:team_id])

        render_not_found_team if team.nil?
      end

      def authorize_gm!
        authorize_team!(team, role_key: "gm")
      end

      # Direction is read off where the player already sits, never taken from the
      # request: on `team` itself, this is a send-down; on one of team's current
      # affiliates, it's a call-up back to `team`. Either way `team`'s GM is the only
      # one who can initiate it — the affiliate's own GM has no membership on `team`.
      def set_roster_spot_and_destination
        @roster_spot = RosterSpot.find_by(team: team, player_id: params[:player_id])
        return set_send_down if roster_spot

        set_call_up
      end

      def set_send_down
        return render_missing_destination if params[:destination_team_id].blank?

        affiliation = affiliations_for(team).find_by(affiliate_team_id: params[:destination_team_id])
        return render_no_affiliation if affiliation.nil?

        @destination_team = affiliation.affiliate_team
        @destination_season = latest_season(destination_team.league)
        render_no_season if destination_season.nil?
      end

      def set_call_up
        affiliation = affiliations_for(team).detect { |a| affiliate_roster_spot(a).present? }
        return render_not_found_player if affiliation.nil?

        @roster_spot = affiliate_roster_spot(affiliation)
        @destination_team = team
        @destination_season = affiliation.season
      end

      def affiliations_for(parent_team)
        season = latest_season(parent_team.league)
        return TeamAffiliation.none if season.nil?

        TeamAffiliation.for_season(season).where(parent_team: parent_team)
      end

      def affiliate_roster_spot(affiliation)
        RosterSpot.find_by(team: affiliation.affiliate_team, player_id: params[:player_id])
      end

      def latest_season(league)
        league.seasons.chronological.last
      end

      def render_not_found_team
        render_error(code: "not_found", message: "Team not found", status: :not_found)
      end

      def render_not_found_player
        render_error(code: "not_found",
                     message: "Player not found on this team or an affiliate for the current season",
                     status: :not_found)
      end

      def render_missing_destination
        render_error(code: "invalid_parameter", message: "destination_team_id is required to send a player down",
                     status: :unprocessable_content)
      end

      def render_no_affiliation
        render_error(code: "not_found", message: "No affiliation between these teams for the current season",
                     status: :not_found)
      end

      def render_no_season
        render_error(code: "not_found", message: "Destination team has no season on record",
                     status: :not_found)
      end

      def render_invalid(errors)
        render_error(code: "invalid_parameter", message: errors.join(", "), status: :unprocessable_content)
      end
    end
  end
end
