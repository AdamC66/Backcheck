FactoryBot.define do
  factory :team_season_advanced_stat do
    season
    team { association :team, league: season.league }

    strength_state { PlayerGameAdvancedStat::STRENGTH_STATES[:all] }
    game_type { Game::GAME_TYPES[:regular_season] }
    games_played { 10 }
    corsi_for { 580 }
    corsi_against { 420 }
    fenwick_for { 450 }
    fenwick_against { 330 }
    xg_for { 28.5 }
    xg_against { 21.0 }
    faceoff_wins { 300 }
    faceoff_losses { 250 }
    pdo { 100.9 }
    toi_seconds { 36000 }
  end
end
