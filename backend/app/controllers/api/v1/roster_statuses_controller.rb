module Api
  module V1
    class RosterStatusesController < BaseController
      before_action :set_team, only: :update
      before_action :authorize_gm!, only: :update
      before_action :set_player_and_season, only: :update

      def index
        season = resolve_season
        return if performed?

        page = RosterStatusPage.new(scope: filtered_scope(season), page: params[:page], per_page: params[:per_page])

        render_data(page.entries.map { |status| RosterTransactionSerializer.new(status).as_json }, meta: page.meta)
      end

      def update
        return render_invalid_status unless valid_status?

        effective_on = parse_effective_on
        return if performed?

        result = SetRosterStatus.new(player: player, team: team, season: @season,
                                      status: params[:status], effective_on: effective_on).call

        return render_invalid(result.errors) unless result.success?

        render_data({ player_id: player.id }.merge(RosterStatusSerializer.new(result.result).as_json))
      end

      private

      attr_reader :player, :team

      def set_team
        @team = Team.find_by(id: params[:team_id])

        render_not_found_team if team.nil?
      end

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

      def filtered_scope(season)
        scope = RosterStatus.includes(:player, :team, :season).order(started_on: :desc, id: :desc)
        scope = scope.where(team_id: params[:team_id]) if params[:team_id].present?
        scope = scope.where(player_id: params[:player_id]) if params[:player_id].present?
        scope = scope.where(season: season) if season

        scope
      end

      # A season label alone is ambiguous across leagues, so it's resolved through the
      # team's league when one is given, rather than matched globally.
      def resolve_season
        return nil if params[:season].blank?

        seasons = params[:team_id].present? ? Team.find_by(id: params[:team_id])&.league&.seasons : Season
        season = seasons&.find_by(label: params[:season])

        render_not_found_season if season.nil?
        season
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

      def render_not_found_team
        render_error(code: "not_found", message: "Team not found", status: :not_found)
      end

      def render_not_found_season
        render_error(code: "not_found", message: "Season not found", status: :not_found)
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
