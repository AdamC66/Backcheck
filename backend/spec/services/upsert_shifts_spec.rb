require "rails_helper"

RSpec.describe UpsertShifts do
  let(:season) { create(:season) }
  # Fixture ids: home (SJS) = 28, away (CBJ) = 29.
  let(:home_team) { create(:team, league: season.league, nhl_team_id: 28) }
  let(:away_team) { create(:team, league: season.league, nhl_team_id: 29) }
  let(:game) { create(:game, season: season, home_team: home_team, away_team: away_team, nhl_game_id: 2024020204) }
  let(:payload) { JSON.parse(nhl_fixture("shift_chart")).fetch("data") }

  # Wennberg and Marchenko are deliberately left unmatched to exercise missing_players
  # reporting; the fixture's typeCode 505 row (also Wennberg) is goal-marker noise anyway.
  before do
    { 8478007 => "Merzlikins", 8479671 => "Olivier", 8479941 => "Danforth", 8479983 => "Ferraro",
      8484227 => "Smith", 8480043 => "Liljegren", 8477497 => "Monahan", 8481567 => "Thrun",
      8482705 => "Sillinger", 8482144 => "Thompson", 8480188 => "Zetterlund" }.each do |nhl_id, last_name|
      create(:player, nhl_player_id: nhl_id, last_name: last_name)
    end
  end

  def upsert
    described_class.new(game: game, payload: payload)
  end

  it "parses a real shift row's team/period/start/end" do
    upsert.call

    shift = Shift.joins(:player).find_by(game: game, players: { last_name: "Thompson" })
    expect(shift).to have_attributes(team: home_team, period: 1, start_time_seconds: 173, end_time_seconds: 256)
  end

  it "filters out goal-marker noise rows (typeCode 505), keeping only real shifts (517)" do
    sync = upsert
    events = sync.call

    expect(Shift.where(game: game).count).to eq(events.size)
    expect(events.size).to eq(11)
  end

  it "reports an unmatched player rather than creating a partial row" do
    sync = upsert
    sync.call

    expect(sync.missing_players).to include(8477505, 8480893)
  end

  it "is safe to re-run: re-parsing the same payload doesn't create duplicates" do
    2.times { upsert.call }

    expect(Shift.where(game: game).count).to eq(11)
  end
end
