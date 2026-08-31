module Api
  module V1
    class LineupsController < BaseController
      before_action :set_team
      before_action :set_game
      before_action :authorize_coach!, only: :update
      before_action :reject_when_locked, only: :update

      def show
        lineup = Lineup.includes(slots: :player).find_by(team: team, game: game)
        return render_not_found_lineup if lineup.nil? || !visible?(lineup)

        render_data(LineupSerializer.new(lineup).as_json)
      end

      def update
        result = SetLineup.new(team: team, game: game, params: params).call
        return render_invalid(result.errors) unless result.success?

        lineup = Lineup.includes(slots: :player).find(result.lineup.id)
        render_data(LineupSerializer.new(lineup).as_json)
      end

      private

      attr_reader :team, :game

      def set_team
        @team = Team.find_by(id: params[:team_id])

        render_error(code: "not_found", message: "Team not found", status: :not_found) if team.nil?
      end

      def set_game
        @game = Game.find_by(id: params[:game_id])
        return render_error(code: "not_found", message: "Game not found", status: :not_found) if game.nil?
        return if team && [ game.home_team_id, game.away_team_id ].include?(team.id)

        render_error(code: "not_found", message: "This team does not play in that game", status: :not_found)
      end

      def authorize_coach!
        authorize_team!(team, role_key: "coaching_staff")
      end

      # From scheduled puck drop on, the lineup is a public game record, not an
      # editable draft — see docs/DECISIONS.md.
      def reject_when_locked
        return if game.starts_at > Time.current

        render_error(code: "forbidden", message: "Lineup is locked once the game starts", status: :forbidden)
      end

      def visible?(lineup)
        lineup.historical? || current_user.authorized_for_team?(team)
      end

      def render_not_found_lineup
        render_error(code: "not_found", message: "Lineup not found", status: :not_found)
      end

      def render_invalid(errors)
        render_error(code: "invalid_parameter", message: errors.join(", "), status: :unprocessable_content)
      end
    end
  end
end
