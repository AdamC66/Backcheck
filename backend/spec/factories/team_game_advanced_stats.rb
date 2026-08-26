FactoryBot.define do
  factory :team_game_advanced_stat do
    game
    team { game.home_team }

    strength_state { PlayerGameAdvancedStat::STRENGTH_STATES[:all] }
    corsi_for { 58 }
    corsi_against { 42 }
    fenwick_for { 45 }
    fenwick_against { 33 }
    xg_for { 2.85 }
    xg_against { 2.10 }
    faceoff_wins { 30 }
    faceoff_losses { 25 }
    pdo { 100.9 }
    toi_seconds { 3600 }
  end
end
