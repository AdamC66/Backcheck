require "rails_helper"

RSpec.describe UpsertGameEvents do
  let(:season) { create(:season) }
  # Fixture ids: home (SJS) = 28, away (CBJ) = 29.
  let(:home_team) { create(:team, league: season.league, nhl_team_id: 28) }
  let(:away_team) { create(:team, league: season.league, nhl_team_id: 29) }
  let(:game) { create(:game, season: season, home_team: home_team, away_team: away_team, nhl_game_id: 2024020204) }
  let(:payload) { JSON.parse(nhl_fixture("play_by_play")) }

  # Players resolvable in the fixture; takeaway (8477505) and giveaway (8480893) are
  # deliberately left unmatched to exercise missing_players reporting.
  before do
    { 8482144 => "Thompson", 8484227 => "Smith", 8480188 => "Zetterlund", 8479941 => "Danforth",
      8480043 => "Liljegren", 8477497 => "Monahan", 8479671 => "Olivier", 8479983 => "Ferraro",
      8482705 => "Sillinger", 8481567 => "Thrun" }.each do |nhl_id, last_name|
      create(:player, nhl_player_id: nhl_id, last_name: last_name)
    end
  end

  def upsert
    described_class.new(game: game, payload: payload)
  end

  it "parses a goal event's scorer and both assists into one row" do
    upsert.call

    goal = GameEvent.find_by(game: game, event_type: GameEvent::EVENT_TYPES[:goal])
    expect(goal.primary_player.last_name).to eq("Thompson")
    expect(goal.secondary_player.last_name).to eq("Smith")
    expect(goal.tertiary_player.last_name).to eq("Zetterlund")
    expect(goal.home_team_defending_side).to eq("right")
  end

  it "skips play types this schema doesn't model" do
    sync = upsert
    events = sync.call

    expect(events.map(&:event_type)).not_to include(nil)
    expect(GameEvent.where(game: game).count).to eq(events.size)
  end

  it "derives strength_state from situationCode, including a power-play attribution" do
    upsert.call

    faceoff = GameEvent.find_by(game: game, event_type: GameEvent::EVENT_TYPES[:faceoff])
    expect(faceoff.strength_state).to eq(GameEvent::STRENGTH_STATES[:even_strength])

    blocked = GameEvent.find_by(game: game, event_type: GameEvent::EVENT_TYPES[:blocked_shot])
    expect(blocked.strength_state).to eq(GameEvent::STRENGTH_STATES[:power_play])
  end

  it "reports an unmatched primary player rather than creating a partial row" do
    sync = upsert
    sync.call

    expect(sync.missing_players).to include(8477505, 8480893)
    expect(GameEvent.where(game: game, event_type: GameEvent::EVENT_TYPES[:takeaway])).to be_none
  end

  it "is safe to re-run: re-parsing the same payload doesn't create duplicates" do
    2.times { upsert.call }

    expect(GameEvent.where(game: game).count).to eq(7)
  end
end
