class PlayerSerializer
  include PlayerImages

  POSITION_NAMES = Player::POSITIONS.invert.freeze

  def initialize(player)
    @player = player
  end

  def as_json(*)
    {
      id: player.id,
      first_name: player.first_name,
      last_name: player.last_name,
      position: POSITION_NAMES.fetch(player.position).to_s,
      shoots_catches: player.shoots_catches,
      height_in_inches: player.height_in_inches,
      weight_in_pounds: player.weight_in_pounds,
      birth_date: player.birth_date,
      birth_city: player.birth_city,
      birth_country: player.birth_country,
      headshot_url: headshot_url(player),
      draft: draft_json
    }
  end

  private

  attr_reader :player

  def draft_json
    return nil if player.draft_year.blank?

    { year: player.draft_year, round: player.draft_round, overall: player.draft_overall,
      team_name: player.draft_team_name }
  end
end
