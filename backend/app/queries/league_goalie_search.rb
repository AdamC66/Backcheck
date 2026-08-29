class LeagueGoalieSearch
  include PlayerStatSearch

  SUM_COLUMNS = %w[
    games_played games_started wins losses ot_losses shutouts shots_against saves goals_against
    time_on_ice_seconds
  ].freeze

  columns([
    { key: :player, label: "Player", format: :text, group: :identity, sort: "players.last_name" },
    { key: :team, label: "Team", format: :text, group: :identity, sortable: false },
    { key: :games_played, label: "GP", title: "Games played", format: :int, group: :basic },
    { key: :games_started, label: "GS", title: "Games started", format: :int, group: :basic },
    { key: :wins, label: "W", title: "Wins", format: :int, group: :basic },
    { key: :losses, label: "L", title: "Losses", format: :int, group: :basic },
    { key: :ot_losses, label: "OTL", title: "Overtime losses", format: :int, group: :basic },
    { key: :shutouts, label: "SO", title: "Shutouts", format: :int, group: :basic },
    { key: :save_pctg, label: "SV%", title: "Save percentage", format: :pct3, group: :basic },
    { key: :goals_against_average, label: "GAA", title: "Goals against average", format: :decimal2, group: :basic },
    { key: :shots_against, label: "SA", title: "Shots against", format: :int, group: :basic },
    { key: :saves, label: "SV", title: "Saves", format: :int, group: :basic },
    { key: :goals_against, label: "GA", title: "Goals against", format: :int, group: :basic }
  ])

  default_sort :wins, :desc

  private

  def stat_model = GoalieSeasonStat

  def advanced? = false

  def computed_select_sql
    [
      "CASE WHEN stats.shots_against > 0 THEN stats.saves::float / stats.shots_against END AS save_pctg",
      "CASE WHEN stats.time_on_ice_seconds > 0 " \
        "THEN stats.goals_against::float * 3600 / stats.time_on_ice_seconds END AS goals_against_average"
    ]
  end
end
