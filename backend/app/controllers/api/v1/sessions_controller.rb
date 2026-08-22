module Api
  module V1
    class SessionsController < ApplicationController
      def create
        user = User.find_by(email: params[:email]&.downcase)

        if user&.authenticate(params[:password])
          token = JsonWebToken.encode(user.id)
          render json: {
            token: token,
            user: { id: user.id, email: user.email, is_super_admin: user.is_super_admin }
          }, status: :created
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end
    end
  end
end
