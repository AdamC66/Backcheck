module Api
  module V1
    class LeagueSkatersController < BaseController
      include TableEndpoint

      def index
        render_table(LeagueSkaterSearch.new(params))
      end

      def schema
        render_schema(LeagueSkaterSearch.new(params))
      end
    end
  end
end
