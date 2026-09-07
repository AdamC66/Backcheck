module Api
  module V1
    class GameShotsController < BaseController
      before_action :set_game

      def index
        list = GameShotList.new(game: @game)

        render_data(
          list.shots.map { |shot| GameShotSerializer.new(shot).as_json },
          meta: { unlocated_count: list.unlocated_count }
        )
      end

      private

      def set_game
        @game = Game.find_by(id: params[:game_id])

        render_error(code: "not_found", message: "Game not found", status: :not_found) if @game.nil?
      end
    end
  end
end
