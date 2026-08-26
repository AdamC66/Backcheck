class PlayerGameAdvancedStatSerializer
  def initialize(stat)
    @stat = stat
  end

  def as_json(*)
    {
      player: PlayerSerializer.new(stat.player).as_json,
      team_id: stat.team_id,
      strength_state: stat.strength_state,
      score_state: stat.score_state,
      corsi_for: stat.corsi_for,
      corsi_against: stat.corsi_against,
      fenwick_for: stat.fenwick_for,
      fenwick_against: stat.fenwick_against,
      xg_for: stat.xg_for.to_f,
      xg_against: stat.xg_against.to_f,
      zone_entries: stat.zone_entries,
      zone_exits: stat.zone_exits,
      toi_seconds: stat.toi_seconds
    }
  end

  private

  attr_reader :stat
end
