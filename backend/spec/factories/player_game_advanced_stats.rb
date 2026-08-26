FactoryBot.define do
  factory :player_game_advanced_stat do
    game
    player
    team { game.home_team }
    xg_model

    strength_state { PlayerGameAdvancedStat::STRENGTH_STATES[:all] }
    corsi_for { 12 }
    corsi_against { 8 }
    fenwick_for { 9 }
    fenwick_against { 6 }
    xg_for { 0.85 }
    xg_against { 0.42 }
    zone_entries { 3 }
    zone_exits { 2 }
    toi_seconds { 1080 }
  end
end
