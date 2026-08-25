module Api
  module V1
    class ReassignmentsController < BaseController
      CONTRACT_LEVEL_BY_LEAGUE_SLUG = { "ahl" => :ahl, "echl" => :echl }.freeze

      before_action :set_team, only: :update
      before_action :authorize_gm!, only: :update
      before_action :set_direction, only: :update

      def update
        result = direction == :send_down ? send_down : call_up
        return render_invalid(result.errors) unless result.success?

        render_data({ team: TeamSerializer.new(result.result.team, include_league: true).as_json }
                      .merge(RosterSpotSerializer.new(result.result).as_json))
      end

      private

      attr_reader :team, :player, :affiliation, :direction, :affiliate_season

      def set_team
        @team = Team.find_by(id: params[:team_id])

        render_not_found_team if team.nil?
      end

      def authorize_gm!
        authorize_team!(team, role_key: "gm")
      end

      # A roster_spot on `team` doesn't rule out a call-up — a two-way player keeps it
      # while down. Direction follows the same non-nhl-tagged affiliate row TeamRoster uses.
      def set_direction
        @player = Player.find_by(id: params[:player_id])
        return render_not_found_player if player.nil?

        @affiliation, @affiliate_season = current_affiliate_assignment

        if affiliation
          @direction = :call_up
        else
          @direction = :send_down
          set_send_down_destination
        end
      end

      def current_affiliate_assignment
        TeamAffiliation.current_for(team).filter_map do |a|
          season = a.affiliate_team.league.seasons.overlapping(a.season).chronological.last
          next if season.nil?

          assigned = RosterSpot.where(team: a.affiliate_team, player: player, season: season)
                                .where.not(contract_level: RosterSpot::CONTRACT_LEVELS[:nhl]).exists?
          [ a, season ] if assigned
        end.first || [ nil, nil ]
      end

      def set_send_down_destination
        return render_missing_destination if params[:destination_team_id].blank?

        @affiliation = TeamAffiliation.current_for(team).find_by(affiliate_team_id: params[:destination_team_id])
        return render_no_affiliation if affiliation.nil?

        league = affiliation.affiliate_team.league
        @affiliate_season = league.seasons.overlapping(affiliation.season).chronological.last
        render_no_season if affiliate_season.nil?
      end

      def send_down
        level = CONTRACT_LEVEL_BY_LEAGUE_SLUG.fetch(affiliation.affiliate_team.league.slug, :unknown)
        SetRosterAssignment.new(player: player, team: affiliation.affiliate_team, season: affiliate_season,
                                 contract_level: level).call
      end

      # Re-tags the affiliate row nhl instead of deleting it, and anchors the parent row
      # to team's own current_roster_season rather than affiliation.season — they can drift.
      def call_up
        parent_season = team.current_roster_season || affiliation.season
        result = nil

        RosterSpot.transaction do
          result = SetRosterAssignment.new(player: player, team: affiliation.affiliate_team,
                                            season: affiliate_season, contract_level: :nhl).call
          raise ActiveRecord::Rollback unless result.success?

          result = SetRosterAssignment.new(player: player, team: team, season: parent_season,
                                            contract_level: :nhl).call
          raise ActiveRecord::Rollback unless result.success?
        end

        result
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
        render_error(code: "not_found", message: "Destination team has no season on record", status: :not_found)
      end

      def render_invalid(errors)
        render_error(code: "invalid_parameter", message: errors.join(", "), status: :unprocessable_content)
      end
    end
  end
end
