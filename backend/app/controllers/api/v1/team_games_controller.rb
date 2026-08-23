module Api
  module V1
    class TeamGamesController < TeamsController
      include GameFiltering

      def index
        season = find_season
        return render_not_found_season if season.nil?

        range = narrowed_range(season)
        return if performed?

        games = games_in(season, range)

        render_data(games.map { |game| GameSerializer.new(game).as_json },
                    meta: meta_for(season, games, range))
      end

      private

      # Newest season *this team has games in*, not the current one — a season is seeded
      # ahead of its own schedule (SyncSeasons runs before SyncTeamSchedule fills it in),
      # so the newest row can be a real season with nothing scheduled yet. An explicit
      # ?season= is taken as asked, empty or not.
      def find_season
        seasons = team.league.seasons
        return seasons.find_by(label: params[:season]) if params[:season].present?

        seasons.where(id: Game.for_team(team).select(:season_id)).chronological.last
      end

      # Unbounded by default: the season already bounds the games, and its start/end dates
      # are the standings window, which would drop preseason and playoff dates.
      def narrowed_range(season)
        return if params[:from].blank? && params[:to].blank?

        requested_range(fallback: season.starts_on, to_fallback: season.ends_on)
      end

      def games_in(season, range)
        scope = Game.for_season(season).for_team(team)
                    .includes(home_team: { logo_attachment: :blob },
                              away_team: { logo_attachment: :blob })
        scope = scope.where(game_date: range) if range

        filter_game_type(scope).chronological
      end

      def meta_for(season, games, range)
        {
          season: season.label,
          from: range&.first || games.first&.game_date,
          to: range&.last || games.last&.game_date,
          count: games.size
        }
      end

      def render_not_found_season
        render_error(code: "not_found", message: "Season not found", status: :not_found)
      end
    end
  end
end
