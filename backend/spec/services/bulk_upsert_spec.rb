require "rails_helper"

RSpec.describe BulkUpsert do
  let(:season) { create(:season) }
  let(:home_team) { create(:team, league: season.league) }
  let(:away_team) { create(:team, league: season.league) }
  let(:game) { create(:game, season: season, home_team: home_team, away_team: away_team) }

  def bulk
    described_class.new(model: Shift, unique_by: %i[game_id nhl_shift_id])
  end

  it "writes every valid record in one statement, and reports invalid ones instead of raising" do
    player = create(:player)
    valid = Shift.new(game: game, nhl_shift_id: 1, team: home_team, player: player,
                      period: 1, start_time_seconds: 0, end_time_seconds: 60)
    invalid = Shift.new(game: game, nhl_shift_id: 2, team: create(:team), player: player,
                        period: 1, start_time_seconds: 0, end_time_seconds: 60)
    b = bulk

    added = [ b.add(valid), b.add(invalid) ]
    b.call

    expect(added).to eq([ true, false ])
    expect(Shift.where(game: game).count).to eq(1)
    expect(b.failures.size).to eq(1)
    expect(b.failures.first).to include("must be one of the game's two teams")
  end

  # Regression guard: an unsaved instance has no id to exclude itself from Rails'
  # own uniqueness check, so re-upserting an existing row must not reject itself.
  it "updates an already-existing row instead of rejecting it as a duplicate of itself" do
    player = create(:player)
    create(:shift, game: game, nhl_shift_id: 1, team: home_team, player: player, start_time_seconds: 0,
          end_time_seconds: 60)
    updated = Shift.new(game: game, nhl_shift_id: 1, team: home_team, player: player,
                        period: 1, start_time_seconds: 0, end_time_seconds: 90)
    b = bulk

    expect(b.add(updated)).to be true
    b.call

    expect(Shift.where(game: game).count).to eq(1)
    expect(Shift.find_by(game: game, nhl_shift_id: 1).end_time_seconds).to eq(90)
  end
end
