module Api
  module V1
    class GamesController < BaseController
      before_action :set_game

      def show
        goals, penalties = scoring_and_penalty_events.partition { |event| event.event_type == GameEvent::EVENT_TYPES[:goal] }

        render_data(
          {
            game: GameSerializer.new(game).as_json,
            skaters: skater_game_stats.map { |stat| SkaterGameStatSerializer.new(stat).as_json },
            goalies: goalie_game_stats.map { |stat| GoalieGameStatSerializer.new(stat).as_json },
            goals: goals.map { |event| GameEventSerializer.new(event).as_json },
            penalties: penalties.map { |event| GameEventSerializer.new(event).as_json },
            advanced: {
              players: player_advanced_stats.map { |stat| PlayerGameAdvancedStatSerializer.new(stat).as_json },
              teams: team_advanced_stats.map { |stat| TeamGameAdvancedStatSerializer.new(stat).as_json }
            },
            zone_time: GameZoneTimeSerializer.new(game).as_json,
            period_summary: GamePeriodSummarySerializer.new(game).as_json
          },
          meta: meta_for(game)
        )
      end

      private

      attr_reader :game

      def set_game
        @game = Game.includes(home_team: { logo_attachment: :blob }, away_team: { logo_attachment: :blob })
                    .find_by(id: params[:id])

        render_not_found if game.nil?
      end

      def skater_game_stats
        SkaterGameStat.where(game: game).joins(:player).includes(:player)
                      .order("players.last_name, players.first_name")
      end

      def goalie_game_stats
        GoalieGameStat.where(game: game).joins(:player).includes(:player)
                      .order("players.last_name, players.first_name")
      end

      def scoring_and_penalty_events
        GameEvent.where(game: game, event_type: GameEvent::EVENT_TYPES.values_at(:goal, :penalty))
                 .includes(:primary_player, :secondary_player, :tertiary_player)
                 .order(:period, :period_time_seconds, :nhl_event_id)
      end

      # The whole-game picture, not a split — strength/score-state breakdowns are a
      # deeper drill-down this v1 page doesn't expose yet.
      def player_advanced_stats
        PlayerGameAdvancedStat.where(game: game, strength_state: "all", score_state: "all")
                              .joins(:player).includes(:player).order("players.last_name, players.first_name")
      end

      def team_advanced_stats
        TeamGameAdvancedStat.where(game: game, strength_state: "all", score_state: "all")
      end

      def meta_for(game)
        game.stats_syncing ? { stats_syncing: true } : {}
      end

      def render_not_found
        render_error(code: "not_found", message: "Game not found", status: :not_found)
      end
    end
  end
end
