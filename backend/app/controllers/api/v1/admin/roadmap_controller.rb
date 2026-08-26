module Api
  module V1
    module Admin
      class RoadmapController < BaseController
        PLANNING_ROOT = Rails.root.join("..", "planning", "data")

        def show
          render_data({
            epics: JSON.parse(File.read(PLANNING_ROOT.join("epics.json"))),
            tasks: JSON.parse(File.read(PLANNING_ROOT.join("tasks.json")))
          })
        end
      end
    end
  end
end
