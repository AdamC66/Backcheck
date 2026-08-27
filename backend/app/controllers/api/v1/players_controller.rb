module Api
  module V1
    class PlayersController < BaseController
      GAME_TYPE_NAMES = Game::GAME_TYPES.invert.freeze
      GAME_TYPES_BY_NAME = Game::GAME_TYPES.transform_keys(&:to_s).freeze

      before_action :set_player

      def show
        game_type = find_game_type
        return if performed?

        render_data(
          {
            player: PlayerSerializer.new(player).as_json,
            current_team: current_team_json,
            skater_seasons: skater_seasons(game_type).map { |stat| PlayerSkaterSeasonSerializer.new(stat).as_json },
            goalie_seasons: goalie_seasons(game_type).map { |stat| PlayerGoalieSeasonSerializer.new(stat).as_json },
            advanced_seasons: advanced_seasons(game_type).map { |stat| PlayerAdvancedSeasonSerializer.new(stat).as_json }
          },
          meta: { game_type: GAME_TYPE_NAMES.fetch(game_type).to_s }
        )
      end

      private

      attr_reader :player

      def current_team_json
        team = player.current_team
        team.nil? ? nil : TeamSerializer.new(team).as_json
      end

      def set_player
        @player = Player.find_by(id: params[:id])

        render_not_found if player.nil?
      end

      def skater_seasons(game_type)
        SkaterSeasonStat.where(player: player, game_type: game_type)
                        .joins(:season).includes(:season, :team).order("seasons.starts_on")
      end

      def goalie_seasons(game_type)
        GoalieSeasonStat.where(player: player, game_type: game_type)
                        .joins(:season).includes(:season, :team).order("seasons.starts_on")
      end

      def advanced_seasons(game_type)
        LatestPlayerSeasonAdvancedStatsForPlayer.new(player: player, game_type: game_type).call
                                                .sort_by { |stat| stat.season.starts_on }
      end

      def find_game_type
        return Game::GAME_TYPES[:regular_season] if params[:game_type].blank?

        GAME_TYPES_BY_NAME[params[:game_type]] || render_invalid_game_type
      end

      def render_invalid_game_type
        render_error(code: "invalid_parameter",
                     message: "game_type must be one of #{GAME_TYPES_BY_NAME.keys.join(', ')}",
                     status: :unprocessable_content)
        nil
      end

      def render_not_found
        render_error(code: "not_found", message: "Player not found", status: :not_found)
      end
    end
  end
end
