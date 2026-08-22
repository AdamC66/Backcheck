module Api
  module V1
    class HealthController < ApplicationController
      def show
        render_data({ status: "ok" })
      end
    end
  end
end
