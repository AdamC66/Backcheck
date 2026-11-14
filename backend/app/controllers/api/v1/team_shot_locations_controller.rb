module Api
  module V1
    class TeamShotLocationsController < TeamsController
      GAME_TYPE_NAMES = Game::GAME_TYPES.invert.freeze
      GAME_TYPES_BY_NAME = Game::GAME_TYPES.transform_keys(&:to_s).freeze

      def show
        game_type = find_game_type
        return if performed?

        season = find_season
        return render_not_found_season if season.nil?

        games = Game.for_season(season).for_team(team).finished.where(game_type: game_type)
        for_list = ShotLocationList.new(games: games, team: team, side: :for)
        against_list = ShotLocationList.new(games: games, team: team, side: :against)

        render_data(
          {
            for: serialize(for_list.shots),
            against: serialize(against_list.shots)
          },
          meta: {
            season: season.label,
            game_type: GAME_TYPE_NAMES.fetch(game_type).to_s,
            unlocated_for: for_list.unlocated_count,
            unlocated_against: against_list.unlocated_count
          }
        )
      end

      private

      def serialize(shots)
        shots.map { |shot| TeamShotLocationSerializer.new(shot).as_json }
      end

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
