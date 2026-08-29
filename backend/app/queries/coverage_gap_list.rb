# The per-game or per-team breakdown behind one cell of LeagueCoverageMatrix:
# which specific games/teams are missing, stale, or syncing (TASK-92).
class CoverageGapList
  KINDS = %w[games roster stats advanced].freeze

  class UnknownKind < StandardError; end

  def initialize(season:, kind:)
    @season = season
    @kind = kind.to_s
    raise UnknownKind, kind.inspect unless KINDS.include?(@kind)
  end

  attr_reader :kind

  def rows
    case kind
    when "games" then games_rows
    when "roster" then roster_rows
    when "stats" then per_game_rows(present_game_ids: game_ids_with_stats, flag: :syncing)
    when "advanced" then per_game_rows(present_game_ids: game_ids_with_advanced, flag: :stale)
    end
  end

  private

  attr_reader :season

  def finished_games
    @finished_games ||= season.games.regular_season.finished.chronological
      .includes(:home_team, :away_team).to_a
  end

  def game_ids
    @game_ids ||= finished_games.map(&:id)
  end

  def per_game_rows(present_game_ids:, flag:)
    flagged = flag == :stale ? stale_game_ids : syncing_game_ids

    finished_games.map do |game|
      {
        game_id: game.id,
        game_date: game.game_date.iso8601,
        matchup: "#{game.away_team.abbreviation} @ #{game.home_team.abbreviation}",
        state: game.state,
        present: present_game_ids.include?(game.id),
        flagged: flagged.include?(game.id),
        flag: flag.to_s
      }
    end
  end

  def games_rows
    have = season.games.regular_season.finished
      .group(:home_team_id, :away_team_id).count
      .each_with_object(Hash.new(0)) { |((home, away), count), acc| acc[home] += count; acc[away] += count }

    active_teams.map do |team|
      expected = expected_games_by_team[team.id]
      {
        team_id: team.id,
        team_name: team.name,
        synced: have.fetch(team.id, 0),
        expected: expected,
        missing: expected ? expected - have.fetch(team.id, 0) : nil
      }
    end
  end

  def roster_rows
    counts = RosterSpot.where(season: season).group(:team_id).count

    active_teams.map do |team|
      {
        team_id: team.id,
        team_name: team.name,
        roster_spots: counts.fetch(team.id, 0),
        present: counts.fetch(team.id, 0).positive?
      }
    end
  end

  def active_teams
    @active_teams ||= begin
      ids = finished_games.flat_map { |game| [ game.home_team_id, game.away_team_id ] }.uniq
      scope = ids.any? ? Team.where(id: ids) : season.league.teams
      scope.alphabetical.to_a
    end
  end

  def expected_games_by_team
    @expected_games_by_team ||= TeamStanding
      .where(season: season)
      .select("DISTINCT ON (team_id) team_id, games_played")
      .order(:team_id, as_of_date: :desc)
      .to_h { |snapshot| [ snapshot.team_id, snapshot.games_played ] }
  end

  def game_ids_with_stats
    @game_ids_with_stats ||= SkaterGameStat.where(game_id: game_ids).distinct.pluck(:game_id).to_set
  end

  def game_ids_with_advanced
    @game_ids_with_advanced ||=
      PlayerGameAdvancedStat.where(game_id: game_ids).distinct.pluck(:game_id).to_set
  end

  def syncing_game_ids
    @syncing_game_ids ||= Game.where(id: game_ids, stats_syncing: true).pluck(:id).to_set
  end

  def stale_game_ids
    @stale_game_ids ||=
      PlayerSeasonAdvancedStat.where(as_of_game_id: game_ids, stale: true).distinct.pluck(:as_of_game_id).to_set
  end
end
