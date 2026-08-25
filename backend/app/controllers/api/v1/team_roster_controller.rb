module Api
  module V1
    class TeamRosterController < TeamsController
      def show
        season = find_season
        return render_not_found_season if season.nil?

        entries = TeamRoster.new(team: team, season: season).call

        render_data(entries.map { |entry|
                      RosterSpotSerializer.new(entry[:roster_spot], assignment: entry[:assignment],
                                                                    roster_status: entry[:roster_status]).as_json
                    },
                    meta: { season: season.label, count: entries.size })
      end

      private

      # An explicit ?season= is taken as asked, empty or not, same as the games and
      # standings endpoints.
      def find_season
        return team.league.seasons.find_by(label: params[:season]) if params[:season].present?

        team.current_roster_season
      end

      def render_not_found_season
        render_error(code: "not_found", message: "Season not found", status: :not_found)
      end
    end
  end
end
