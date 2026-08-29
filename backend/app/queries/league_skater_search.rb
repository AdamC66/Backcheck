class LeagueSkaterSearch
  include PlayerStatSearch

  SUM_COLUMNS = %w[
    games_played goals assists points plus_minus pim hits power_play_goals shots_on_goal
    blocked_shots giveaways takeaways faceoff_wins faceoff_losses time_on_ice_seconds shifts
  ].freeze

  ADVANCED_COLUMNS = %w[
    corsi_for corsi_against fenwick_for fenwick_against xg_for xg_against zone_entries zone_exits
  ].freeze

  POSITION_FILTER = %w[center left_wing right_wing forward defense].freeze

  filter :position, type: :select, values: -> { POSITION_FILTER } do |scope, value|
    scope.where("players.position = ?", Player::POSITIONS.fetch(value.to_sym))
  end
  filter :strength_state, type: :segmented,
         values: -> { PlayerGameAdvancedStat::STRENGTH_STATES.values }, default: "all"
  filter :score_state, type: :segmented,
         values: -> { PlayerGameAdvancedStat::SCORE_STATES.values }, default: "all"

  columns([
    { key: :player, label: "Player", format: :text, group: :identity, sort: "players.last_name" },
    { key: :team, label: "Team", format: :text, group: :identity, sortable: false },
    { key: :games_played, label: "GP", title: "Games played", format: :int, group: :basic },
    { key: :goals, label: "G", title: "Goals", format: :int, group: :basic },
    { key: :assists, label: "A", title: "Assists", format: :int, group: :basic },
    { key: :points, label: "P", title: "Points", format: :int, group: :basic },
    { key: :plus_minus, label: "+/-", title: "Plus/minus", format: :plus_minus, group: :basic },
    { key: :pim, label: "PIM", title: "Penalty minutes", format: :int, group: :basic },
    { key: :shots_on_goal, label: "SOG", title: "Shots on goal", format: :int, group: :basic },
    { key: :shooting_pctg, label: "S%", title: "Shooting percentage", format: :pct1, group: :basic },
    { key: :power_play_goals, label: "PPG", title: "Power-play goals", format: :int, group: :basic },
    { key: :hits, label: "HIT", title: "Hits", format: :int, group: :basic },
    { key: :blocked_shots, label: "BLK", title: "Blocked shots", format: :int, group: :basic },
    { key: :takeaways, label: "TK", title: "Takeaways", format: :int, group: :basic },
    { key: :giveaways, label: "GV", title: "Giveaways", format: :int, group: :basic },
    { key: :faceoff_pctg, label: "FO%", title: "Faceoff win percentage", format: :pct1, group: :basic },
    { key: :toi_per_gp, label: "TOI/GP", title: "Time on ice per game", format: :toi, group: :basic },
    { key: :corsi_for, label: "CF", title: "Corsi for", format: :int, group: :advanced },
    { key: :corsi_against, label: "CA", title: "Corsi against", format: :int, group: :advanced },
    { key: :fenwick_for, label: "FF", title: "Fenwick for", format: :int, group: :advanced },
    { key: :fenwick_against, label: "FA", title: "Fenwick against", format: :int, group: :advanced },
    { key: :xg_for, label: "xGF", title: "Expected goals for", format: :decimal2, group: :advanced },
    { key: :xg_against, label: "xGA", title: "Expected goals against", format: :decimal2, group: :advanced },
    { key: :zone_entries, label: "ZE", title: "Zone entries", format: :int, group: :advanced },
    { key: :zone_exits, label: "ZX", title: "Zone exits", format: :int, group: :advanced }
  ])

  default_sort :points, :desc

  private

  def stat_model = SkaterSeasonStat

  def advanced? = true

  def computed_select_sql
    [
      "CASE WHEN stats.shots_on_goal > 0 THEN stats.goals::float / stats.shots_on_goal END AS shooting_pctg",
      "CASE WHEN (stats.faceoff_wins + stats.faceoff_losses) > 0 " \
        "THEN stats.faceoff_wins::float / (stats.faceoff_wins + stats.faceoff_losses) END AS faceoff_pctg",
      "CASE WHEN stats.games_played > 0 THEN stats.time_on_ice_seconds / stats.games_played END AS toi_per_gp"
    ]
  end
end
