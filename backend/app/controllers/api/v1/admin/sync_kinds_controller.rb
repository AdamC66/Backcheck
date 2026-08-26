module Api
  module V1
    module Admin
      class SyncKindsController < BaseController
        def index
          kinds = SyncRun::SYNC_KINDS.keys.map do |kind|
            { kind: kind.to_s, scope: SyncKindRegistry.scope_axes(kind).map(&:to_s) }
          end

          render_data(kinds)
        end
      end
    end
  end
end
