module Api
  module V1
    class TeamGamesController < TeamsController
      def index
        season = find_season
        return render_not_found_season if season.nil?

        render_data(games(season).map { |game| GameSerializer.new(game).as_json },
                    meta: { season: season.label, count: games(season).size })
      end

      private

      def find_season
        seasons = team.league.seasons
        return seasons.chronological.last if params[:season].blank?

        seasons.find_by(label: params[:season])
      end

      def games(season)
        @games ||= begin
          scope = Game.for_season(season).for_team(team)
                      .includes(home_team: { logo_attachment: :blob }, away_team: { logo_attachment: :blob })
          scope = scope.regular_season if params[:game_type] == "regular_season"
          scope.chronological
        end
      end

      def render_not_found_season
        render_error(code: "not_found", message: "Season not found", status: :not_found)
      end
    end
  end
end
