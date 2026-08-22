module Api
  module V1
    class BaseController < ApplicationController
      before_action :authenticate_user!

      private

      attr_reader :current_user, :current_token

      def authenticate_user!
        @current_token = verified_token
        @current_user = User.find_by(id: @current_token[:user_id]) if @current_token

        return if @current_user

        render_error(code: "unauthorized", message: "Authentication required", status: :unauthorized)
      end

      def verified_token
        payload = JsonWebToken.decode(bearer_token)
        return if payload.blank?
        return if RevokedToken.revoked?(payload[:jti])

        payload
      end

      def bearer_token
        request.headers["Authorization"]&.delete_prefix("Bearer ")
      end
    end
  end
end
