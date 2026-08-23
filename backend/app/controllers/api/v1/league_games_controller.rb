module Api
  module V1
    class LeagueGamesController < BaseController
      include GameFiltering

      def index
        league = League.visible_to(current_user).find_by(slug: params[:league_slug])
        return render_not_found if league.nil?

        return unless valid_direction?

        page = page_for(league)
        return if page.nil?

        games = page.games

        render_data(games.map { |game| GameSerializer.new(game).as_json },
                    meta: { dates: page.dates, count: games.size,
                            prev_cursor: page.prev_cursor, next_cursor: page.next_cursor })
      end

      private

      def page_for(league)
        anchor = date_param(:date) { Date.current }
        return if performed?

        page = build_page(league, anchor, params[:direction] || "forward")
        # Nothing is scheduled from today through the end of the offseason, so an
        # unanchored request falls back to the most recent games rather than nothing.
        return page if params[:date].present? || page.dates.any?

        build_page(league, anchor, "backward")
      end

      def build_page(league, anchor, direction)
        GameDatePage.new(scope: league_games(league), anchor: anchor, direction: direction,
                         limit: params[:limit]&.to_i)
      end

      def league_games(league)
        filter_game_type(Game.joins(:season).where(seasons: { league_id: league.id }))
      end

      def valid_direction?
        return true if params[:direction].blank? ||
                       GameDatePage::DIRECTIONS.include?(params[:direction])

        render_invalid_parameter("direction must be one of #{GameDatePage::DIRECTIONS.join(', ')}")

        false
      end

      def render_not_found
        render_error(code: "not_found", message: "League not found", status: :not_found)
      end
    end
  end
end
