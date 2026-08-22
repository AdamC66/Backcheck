module Api
  module V1
    class BaseController < ApplicationController
      before_action :authenticate_user!

      attr_reader :current_user

      private

      def authenticate_user!
        header = request.headers["Authorization"]
        token = header&.split(" ")&.last
        payload = token && JsonWebToken.decode(token)
        @current_user = User.find_by(id: payload[:user_id]) if payload

        render json: { error: "Unauthorized" }, status: :unauthorized unless @current_user
      end
    end
  end
end
