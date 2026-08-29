module Api
  module V1
    class LeagueGoaliesController < BaseController
      include TableEndpoint

      def index
        render_table(LeagueGoalieSearch.new(params))
      end

      def schema
        render_schema(LeagueGoalieSearch.new(params))
      end
    end
  end
end
