module Api
  module V1
    class TeamStatsController < TeamsController
      GAME_TYPE_NAMES = Game::GAME_TYPES.invert.freeze
      GAME_TYPES_BY_NAME = Game::GAME_TYPES.transform_keys(&:to_s).freeze

      def show
        game_type = find_game_type
        return if performed?

        season = find_season
        return render_not_found_season if season.nil?

        skaters = stats_for(SkaterSeasonStat, season, game_type)
        goalies = stats_for(GoalieSeasonStat, season, game_type)
        player_advanced = LatestPlayerSeasonAdvancedStats.new(team: team, season: season, game_type: game_type).call
        team_advanced = TeamSeasonAdvancedStat.where(team: team, season: season, game_type: game_type)

        render_data(
          {
            skaters: skaters.map { |stat| SkaterSeasonStatSerializer.new(stat).as_json },
            goalies: goalies.map { |stat| GoalieSeasonStatSerializer.new(stat).as_json },
            advanced: {
              players: player_advanced.map { |stat| PlayerSeasonAdvancedStatSerializer.new(stat).as_json },
              team: team_advanced.map { |stat| TeamSeasonAdvancedStatSerializer.new(stat).as_json }
            }
          },
          meta: { season: season.label, game_type: GAME_TYPE_NAMES.fetch(game_type).to_s,
                  skater_count: skaters.size, goalie_count: goalies.size }
        )
      end

      private

      def stats_for(model, season, game_type)
        model.where(team: team, season: season, game_type: game_type)
             .joins(:player).includes(:player).order("players.last_name, players.first_name")
      end

      # An explicit ?season= is taken as asked, empty or not, same as the games and
      # roster endpoints.
      def find_season
        return team.league.seasons.find_by(label: params[:season]) if params[:season].present?

        team.current_stats_season
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

      def render_not_found_season
        render_error(code: "not_found", message: "Season not found", status: :not_found)
      end
    end
  end
end
