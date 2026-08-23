module Api
  module V1
    class StandingsController < BaseController
      def index
        league = League.visible_to(current_user).find_by(slug: params[:league_slug])
        return render_not_found("League not found") if league.nil?

        season = find_season(league)
        return render_not_found("Season not found") if season.nil?

        render_data(standings(season).map { |standing| StandingSerializer.new(standing).as_json },
                    meta: { season: season.label, as_of_date: standings(season).first&.as_of_date })
      end

      private

      # Newest season *with standings*, not the current one — there is none for most of
      # the summer, and not just the newest season row: a season is seeded ahead of its
      # own data (SyncSeasons runs before the games it will hold exist), so the newest
      # row can be a real season with nothing in it yet. An explicit ?season= is taken
      # as asked, empty or not.
      def find_season(league)
        return league.seasons.find_by(label: params[:season]) if params[:season].present?

        league.seasons.where(id: TeamStanding.select(:season_id)).chronological.last
      end

      def standings(season)
        @standings ||= begin
          scope = season.team_standings.includes(team: { logo_attachment: :blob })
          scope = params[:date].present? ? scope.on_date(params[:date]) : scope.merge(TeamStanding.latest_for_season(season))
          scope.ranked
        end
      end

      def render_not_found(message)
        render_error(code: "not_found", message: message, status: :not_found)
      end
    end
  end
end
