module Api
  module V1
    class LeagueGamesController < BaseController
      include GameFiltering

      MAX_RANGE_DAYS = 31

      def index
        league = League.visible_to(current_user).find_by(slug: params[:league_slug])
        return render_not_found if league.nil?

        range = requested_range(fallback: latest_game_date(league), max_days: MAX_RANGE_DAYS)
        return if range.nil?

        games = games_in(league, range)

        render_data(games.map { |game| GameSerializer.new(game).as_json },
                    meta: { from: range.first, to: range.last, count: games.size })
      end

      private

      # Defaults to the last date with games rather than today, which is empty all summer.
      def latest_game_date(league)
        Game.joins(:season).where(seasons: { league_id: league.id }).maximum(:game_date) ||
          Date.current
      end

      def games_in(league, range)
        scope = Game.joins(:season).where(seasons: { league_id: league.id }, game_date: range)
                    .includes(home_team: { logo_attachment: :blob },
                              away_team: { logo_attachment: :blob })

        filter_game_type(scope).chronological
      end

      def render_not_found
        render_error(code: "not_found", message: "League not found", status: :not_found)
      end
    end
  end
end
