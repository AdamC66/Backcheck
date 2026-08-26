FactoryBot.define do
  factory :game_event do
    game
    team { game.home_team }
    primary_player { association :player }

    sequence(:nhl_event_id) { |n| n }
    period { 1 }
    period_time_seconds { 245 }
    event_type { GameEvent::EVENT_TYPES[:shot] }
    shot_type { GameEvent::SHOT_TYPES[:wrist] }
    zone { GameEvent::ZONES[:offensive] }
    strength_state { GameEvent::STRENGTH_STATES[:even_strength] }
    x_coord { 62 }
    y_coord { -12 }
    home_team_defending_side { GameEvent::DEFENDING_SIDES[:left] }
  end
end
