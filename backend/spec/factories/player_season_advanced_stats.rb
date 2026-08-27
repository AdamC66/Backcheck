FactoryBot.define do
  factory :player_season_advanced_stat do
    player
    as_of_game { association :game }
    season { as_of_game.season }
    team { as_of_game.home_team }

    strength_state { PlayerGameAdvancedStat::STRENGTH_STATES[:all] }
    game_type { as_of_game.game_type }
    games_played { 1 }
    corsi_for { 12 }
    corsi_against { 8 }
    fenwick_for { 9 }
    fenwick_against { 6 }
    xg_for { 0.85 }
    xg_against { 0.42 }
    zone_entries { 3 }
    zone_exits { 2 }
    toi_seconds { 1080 }
    stale { false }
  end
end
