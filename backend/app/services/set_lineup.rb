# Full-replace: whatever the coach submits becomes the team's entire lineup for the
# game, so an omitted section clears it. Rebuilds every slot inside one transaction.
class SetLineup
  UNIT_PARAM_KEYS = {
    forward_lines: :forward_line,
    defense_pairs: :defense_pair,
    power_play_units: :power_play,
    penalty_kill_units: :penalty_kill
  }.freeze

  def initialize(team:, game:, params:)
    @team = team
    @game = game
    @params = params
    @errors = []
  end

  attr_reader :lineup, :errors

  def call
    Lineup.transaction do
      @lineup = Lineup.find_or_initialize_by(team: team, game: game)
      lineup.slots.destroy_all if lineup.persisted?
      lineup.slots.build(slot_rows)

      unless lineup.save
        @errors = lineup.errors.full_messages
        raise ActiveRecord::Rollback
      end
    end

    self
  end

  def success?
    errors.empty?
  end

  private

  attr_reader :team, :game, :params

  def slot_rows
    rows = []

    UNIT_PARAM_KEYS.each do |param_key, unit_type|
      Array(params[param_key]).each_with_index do |player_ids, unit_index|
        Array(player_ids).each_with_index do |player_id, order|
          rows << { player_id: player_id.to_i, unit_type: unit_type, unit_number: unit_index + 1, slot_order: order }
        end
      end
    end

    rows << goalie_row(:starting_goalie_id, 1)
    rows << goalie_row(:backup_goalie_id, 2)
    Array(params[:scratches]).each { |player_id| rows << { player_id: player_id.to_i, unit_type: :scratch } }

    rows.compact
  end

  def goalie_row(param_key, unit_number)
    return if params[param_key].blank?

    { player_id: params[param_key].to_i, unit_type: :goalie, unit_number: unit_number }
  end
end
