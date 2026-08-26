module Api
  module V1
    module Admin
      class BaseController < Api::V1::BaseController
        before_action :require_super_admin!

        private

        # Reads as one question, same shape as BaseController#authorize_team! —
        # every admin route is super-admin-only, no Membership involved.
        def require_super_admin!
          return if current_user.super_admin?

          render_error(code: "forbidden", message: "Super admin required", status: :forbidden)
        end
      end
    end
  end
end
