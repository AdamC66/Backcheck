require "rails_helper"

RSpec.describe ZoneOccupancyTimeline do
  let(:season) { create(:season) }
  let(:home_team) { create(:team, league: season.league) }
  let(:away_team) { create(:team, league: season.league) }
  let(:game) { create(:game, season: season, home_team: home_team, away_team: away_team) }

  def event(attrs)
    create(:game_event, { game: game, team: home_team, home_team_defending_side: GameEvent::DEFENDING_SIDES[:left],
                          primary_player: create(:player) }.merge(attrs))
  end

  it "forward-fills each event's zone to the next and mirrors it for the away team" do
    create(:shift, game: game, team: home_team, player: create(:player), period: 1,
                   start_time_seconds: 0, end_time_seconds: 300)
    event(event_type: GameEvent::EVENT_TYPES[:faceoff], period: 1, period_time_seconds: 0, x_coord: 0)
    event(event_type: GameEvent::EVENT_TYPES[:shot], period: 1, period_time_seconds: 100, x_coord: 75)
    event(event_type: GameEvent::EVENT_TYPES[:hit], period: 1, period_time_seconds: 220, x_coord: -80)

    timeline = described_class.new(game)

    expect(timeline.zone_durations(period: 1, from_seconds: 0, to_seconds: 300, team_id: home_team.id))
      .to eq(neutral: 100, offensive: 120, defensive: 80)
    expect(timeline.zone_durations(period: 1, from_seconds: 0, to_seconds: 300, team_id: away_team.id))
      .to eq(neutral: 100, defensive: 120, offensive: 80)
  end

  it "falls back to zoneCode when coordinates are missing, but never for a blocked shot" do
    create(:shift, game: game, team: home_team, player: create(:player), period: 1,
                   start_time_seconds: 0, end_time_seconds: 120)
    event(event_type: GameEvent::EVENT_TYPES[:faceoff], period: 1, period_time_seconds: 0, x_coord: 0)
    event(event_type: GameEvent::EVENT_TYPES[:giveaway], period: 1, period_time_seconds: 40,
          x_coord: nil, y_coord: nil, zone: GameEvent::ZONES[:offensive])
    event(event_type: GameEvent::EVENT_TYPES[:blocked_shot], period: 1, period_time_seconds: 80,
          x_coord: nil, y_coord: nil, zone: GameEvent::ZONES[:defensive])

    durations = described_class.new(game).zone_durations(period: 1, from_seconds: 0, to_seconds: 120,
                                                        team_id: home_team.id)

    expect(durations).to eq(neutral: 40, offensive: 80, defensive: 0)
  end

  it "produces no segments for a period with no defending-side data" do
    create(:shift, game: game, team: home_team, player: create(:player), period: 1,
                   start_time_seconds: 0, end_time_seconds: 120)
    event(event_type: GameEvent::EVENT_TYPES[:shot], period: 1, period_time_seconds: 30,
          x_coord: 75, home_team_defending_side: nil, zone: nil)

    expect(described_class.new(game).segments(1)).to eq([])
  end
end
