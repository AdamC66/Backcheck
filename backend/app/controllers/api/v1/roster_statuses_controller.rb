module Api
  module V1
    class RosterStatusesController < TeamsController
      before_action :authorize_gm!
      before_action :set_player_and_season

      def update
        return render_invalid_status unless valid_status?

        effective_on = parse_effective_on
        return if performed?

        result = SetRosterStatus.new(player: player, team: team, season: season,
                                      status: params[:status], effective_on: effective_on).call

        return render_invalid(result.errors) unless result.success?

        render_data(RosterStatusSerializer.new(player, result.result).as_json)
      end

      private

      attr_reader :player, :season

      def authorize_gm!
        authorize_team!(team, role_key: "gm")
      end

      # The player's season comes from their own roster_spots row with this team, not a
      # ?season= param — this sets status for "right now," not a browsable point in history.
      def set_player_and_season
        spot = RosterSpot.joins(:season).where(team: team, player_id: params[:player_id])
                          .merge(Season.chronological).last

        return render_not_found_player if spot.nil?

        @player = spot.player
        @season = spot.season
      end

      def valid_status?
        %w[active injured_reserve non_roster].include?(params[:status])
      end

      def parse_effective_on
        return Date.current if params[:effective_on].blank?

        Date.iso8601(params[:effective_on])
      rescue Date::Error
        render_invalid_parameter("effective_on must be a YYYY-MM-DD date")
      end

      def render_not_found_player
        render_error(code: "not_found", message: "Player not found on this team's roster", status: :not_found)
      end

      def render_invalid_status
        render_invalid_parameter("status must be one of active, injured_reserve, non_roster")
      end

      def render_invalid_parameter(message)
        render_error(code: "invalid_parameter", message: message, status: :unprocessable_content)
      end

      def render_invalid(errors)
        render_error(code: "invalid_parameter", message: errors.join(", "), status: :unprocessable_content)
      end
    end
  end
end
