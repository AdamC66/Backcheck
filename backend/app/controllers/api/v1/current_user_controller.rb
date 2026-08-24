module Api
  module V1
    # Lets the frontend confirm a stored token is still good and rehydrate identity on boot.
    class CurrentUserController < BaseController
      def show
        user = User.includes(memberships: [ :role, :scopeable ]).find(current_user.id)

        render_data(UserSerializer.new(user).as_json)
      end
    end
  end
end
