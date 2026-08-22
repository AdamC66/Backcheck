module Api
  module V1
    # Lets the frontend confirm a stored token is still good and rehydrate identity on boot.
    class CurrentUserController < BaseController
      def show
        render_data(UserSerializer.new(current_user).as_json)
      end
    end
  end
end
