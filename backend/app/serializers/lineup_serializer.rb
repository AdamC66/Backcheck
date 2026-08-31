class LineupSerializer
  def initialize(lineup)
    @lineup = lineup
  end

  def as_json(*)
    slots = lineup.slots.to_a

    {
      team_id: lineup.team_id,
      game_id: lineup.game_id,
      historical: lineup.historical?,
      forward_lines: units(slots, "forward_line"),
      defense_pairs: units(slots, "defense_pair"),
      power_play_units: units(slots, "power_play"),
      penalty_kill_units: units(slots, "penalty_kill"),
      starting_goalie: player_json(goalie(slots, 1)),
      backup_goalie: player_json(goalie(slots, 2)),
      scratches: slots.select { |slot| slot.unit_type == "scratch" }.map { |slot| player_json(slot) }
    }
  end

  private

  attr_reader :lineup

  def units(slots, unit_type)
    slots.select { |slot| slot.unit_type == unit_type }
         .group_by(&:unit_number)
         .sort_by(&:first)
         .map { |_number, unit_slots| unit_slots.sort_by { |slot| slot.slot_order || 0 }.map { |slot| player_json(slot) } }
  end

  def goalie(slots, unit_number)
    slots.find { |slot| slot.unit_type == "goalie" && slot.unit_number == unit_number }
  end

  def player_json(slot)
    return nil if slot.nil?

    PlayerSerializer.new(slot.player).as_json
  end
end
