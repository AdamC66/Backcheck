module Api
  module V1
    class DangerZonesController < BaseController
      def show
        render_data(DangerZoneSerializer.new.as_json)
      end
    end
  end
end
