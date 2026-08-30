require "rails_helper"

RSpec.describe ComputeGameZoneTime do
  let(:season) { create(:season) }
  let(:home_team) { create(:team, league: season.league) }
  let(:away_team) { create(:team, league: season.league) }
  let(:game) { create(:game, season: season, home_team: home_team, away_team: away_team) }

  let(:winger) { create(:player, position: Player::POSITIONS[:left_wing]) }
  let(:center) { create(:player, position: Player::POSITIONS[:center]) }
  let(:goalie) { create(:player, position: Player::POSITIONS[:goalie]) }

  def zone_time(player)
    PlayerGameZoneTime.find_by(game: game, player: player)
  end

  def faceoff(period_time_seconds:, x_coord:)
    create(:game_event, game: game, team: home_team, primary_player: create(:player),
                        event_type: GameEvent::EVENT_TYPES[:faceoff], period: 1,
                        period_time_seconds: period_time_seconds, x_coord: x_coord, y_coord: 0,
                        home_team_defending_side: GameEvent::DEFENDING_SIDES[:left])
  end

  before do
    create(:shift, game: game, team: home_team, player: goalie, period: 1,
                   start_time_seconds: 0, end_time_seconds: 1200)
    create(:shift, game: game, team: home_team, player: winger, period: 1,
                   start_time_seconds: 0, end_time_seconds: 120)
    create(:shift, game: game, team: home_team, player: center, period: 1,
                   start_time_seconds: 300, end_time_seconds: 360)

    faceoff(period_time_seconds: 0, x_coord: 0)
    faceoff(period_time_seconds: 100, x_coord: 69)
  end

  it "splits each shift's time across zones and buckets its start by the faceoff that began it" do
    described_class.new(game: game).call

    expect(zone_time(winger)).to have_attributes(
      neutral_seconds: 100, offensive_seconds: 20, defensive_seconds: 0,
      neutral_starts: 1, offensive_starts: 0, on_the_fly_starts: 0
    )
  end

  it "counts a shift with no faceoff at its start as an on-the-fly start" do
    described_class.new(game: game).call

    expect(zone_time(center)).to have_attributes(offensive_seconds: 60, on_the_fly_starts: 1, neutral_starts: 0)
  end

  it "excludes goalies and is safe to re-run" do
    2.times { described_class.new(game: game).call }

    expect(zone_time(goalie)).to be_nil
    expect(zone_time(winger).neutral_seconds).to eq(100)
  end
end
