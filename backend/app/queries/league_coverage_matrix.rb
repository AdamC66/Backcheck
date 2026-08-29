# Per-season sync coverage for a league, computed from the data tables rather than
# SyncRun rows so it reflects what actually landed (TASK-92). Each column is one
# grouped query across every season id, never one per season.
class LeagueCoverageMatrix
  # synced/total are nil for a kind a HockeyTech league has no pipeline for.
  Cell = Data.define(:synced, :total, :stale, :syncing) do
    def self.na = new(synced: nil, total: nil, stale: 0, syncing: 0)
  end

  Row = Data.define(:season_id, :season_label, :games, :roster, :stats, :advanced)

  def initialize(league:)
    @league = league
  end

  def rows
    seasons.map do |season|
      nhl = season.nhl_season_id.present?
      finished = finished_games_by_season.fetch(season.id, 0)

      Row.new(
        season_id: season.id,
        season_label: season.label,
        games: nhl ? games_cell(season, finished) : Cell.na,
        roster: roster_cell(season),
        stats: nhl ? stats_cell(season, finished) : Cell.na,
        advanced: nhl ? advanced_cell(season, finished) : Cell.na
      )
    end
  end

  private

  attr_reader :league

  def seasons
    @seasons ||= league.seasons.order(starts_on: :desc).to_a
  end

  def season_ids
    @season_ids ||= seasons.map(&:id)
  end

  def games_cell(season, finished)
    Cell.new(synced: finished, total: expected_games_by_season[season.id], stale: 0, syncing: 0)
  end

  def roster_cell(season)
    Cell.new(
      synced: rostered_teams_by_season.fetch(season.id, 0),
      total: active_team_count(season),
      stale: 0,
      syncing: 0
    )
  end

  def stats_cell(season, finished)
    Cell.new(
      synced: games_with_stats_by_season.fetch(season.id, 0),
      total: finished,
      stale: 0,
      syncing: syncing_games_by_season.fetch(season.id, 0)
    )
  end

  def advanced_cell(season, finished)
    Cell.new(
      synced: games_with_advanced_by_season.fetch(season.id, 0),
      total: finished,
      stale: stale_advanced_by_season.fetch(season.id, 0),
      syncing: 0
    )
  end

  # Regular season only, to line up with team_standings.games_played.
  def finished_games
    @finished_games ||= Game.where(season_id: season_ids).regular_season.finished
  end

  def finished_games_by_season
    @finished_games_by_season ||= finished_games.group(:season_id).count
  end

  # games_played is counted once per team, so each game appears in two snapshots.
  def expected_games_by_season
    @expected_games_by_season ||= TeamStanding
      .where(season_id: season_ids)
      .select("DISTINCT ON (team_id, season_id) season_id, games_played")
      .order(:team_id, :season_id, as_of_date: :desc)
      .group_by(&:season_id)
      .transform_values { |snapshots| snapshots.sum(&:games_played) / 2 }
  end

  def rostered_teams_by_season
    @rostered_teams_by_season ||=
      RosterSpot.where(season_id: season_ids).group(:season_id).distinct.count(:team_id)
  end

  def games_with_stats_by_season
    @games_with_stats_by_season ||= SkaterGameStat
      .joins(:game).merge(finished_games)
      .group("games.season_id").distinct.count("games.id")
  end

  # PlayerGameAdvancedStat, not GameEvent: a game whose compute step failed isn't covered.
  def games_with_advanced_by_season
    @games_with_advanced_by_season ||= PlayerGameAdvancedStat
      .joins(:game).merge(finished_games)
      .group("games.season_id").distinct.count("games.id")
  end

  def syncing_games_by_season
    @syncing_games_by_season ||=
      Game.where(season_id: season_ids, stats_syncing: true).group(:season_id).count
  end

  def stale_advanced_by_season
    @stale_advanced_by_season ||=
      PlayerSeasonAdvancedStat.where(season_id: season_ids, stale: true).group(:season_id).count
  end

  def active_team_count(season)
    active = active_team_ids_by_season.fetch(season.id, []).size
    active.positive? ? active : league.teams.count
  end

  def active_team_ids_by_season
    @active_team_ids_by_season ||= Game.where(season_id: season_ids)
      .pluck(:season_id, :home_team_id, :away_team_id)
      .each_with_object(Hash.new { |hash, key| hash[key] = Set.new }) do |(season_id, home, away), acc|
        acc[season_id] << home << away
      end
  end
end
