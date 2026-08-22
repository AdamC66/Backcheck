module Api
  module V1
    class SessionsController < BaseController
      skip_before_action :authenticate_user!, only: :create

      def create
        user = User.find_by(email: params[:email].to_s)

        unless user&.authenticate(params[:password].to_s)
          return render_error(
            code: "invalid_credentials",
            message: "Invalid email or password",
            status: :unauthorized
          )
        end

        render_data(
          { token: JsonWebToken.encode(user.id), user: UserSerializer.new(user).as_json },
          status: :created
        )
      end

      def destroy
        RevokedToken.find_or_create_by!(jti: current_token[:jti]) do |revoked|
          revoked.expires_at = Time.zone.at(current_token[:exp])
        end

        head :no_content
      end
    end
  end
end
