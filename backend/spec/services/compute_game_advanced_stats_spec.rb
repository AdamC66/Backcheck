require "rails_helper"

RSpec.describe ComputeGameAdvancedStats do
  let(:season) { create(:season) }
  let(:home_team) { create(:team, league: season.league) }
  let(:away_team) { create(:team, league: season.league) }
  let(:game) { create(:game, season: season, home_team: home_team, away_team: away_team) }

  let(:home_skater_a) { create(:player, position: Player::POSITIONS[:center]) }
  let(:home_skater_b) { create(:player, position: Player::POSITIONS[:defense]) }
  let(:home_skater_bench) { create(:player, position: Player::POSITIONS[:center]) }
  let(:away_skater) { create(:player, position: Player::POSITIONS[:defense]) }
  let(:away_goalie) { create(:player, position: Player::POSITIONS[:goalie]) }

  before do
    create(:xg_model, active: true, coefficients: { intercept: 0, distance: 0, angle: 0 })

    create(:shift, game: game, team: home_team, player: home_skater_a, period: 1,
                  start_time_seconds: 0, end_time_seconds: 200)
    create(:shift, game: game, team: home_team, player: home_skater_b, period: 1,
                  start_time_seconds: 0, end_time_seconds: 200)
    create(:shift, game: game, team: away_team, player: away_skater, period: 1,
                  start_time_seconds: 0, end_time_seconds: 200)
    create(:shift, game: game, team: away_team, player: away_goalie, period: 1,
                  start_time_seconds: 0, end_time_seconds: 1200)
    # On the ice, but not until well after the events below — proves attribution
    # follows shift timing, not just "played in this game."
    create(:shift, game: game, team: home_team, player: home_skater_bench, period: 1,
                  start_time_seconds: 300, end_time_seconds: 400)

    create(:game_event, game: game, team: home_team, primary_player: home_skater_a,
                        event_type: GameEvent::EVENT_TYPES[:shot], period: 1, period_time_seconds: 100,
                        strength_state: GameEvent::STRENGTH_STATES[:even_strength], x_coord: 70, y_coord: 0)
    create(:game_event, game: game, team: home_team, primary_player: home_skater_a,
                        event_type: GameEvent::EVENT_TYPES[:blocked_shot], period: 1, period_time_seconds: 110,
                        strength_state: GameEvent::STRENGTH_STATES[:even_strength], x_coord: 60, y_coord: 10)
  end

  def stat_for(player, strength_state: "all")
    PlayerGameAdvancedStat.find_by(game: game, player: player, strength_state: strength_state)
  end

  it "credits every on-ice skater with on-ice Corsi/Fenwick, not just the event's own player" do
    described_class.new(game: game).call

    expect(stat_for(home_skater_a)).to have_attributes(corsi_for: 2, fenwick_for: 1, team: home_team)
    expect(stat_for(home_skater_b)).to have_attributes(corsi_for: 2, fenwick_for: 1, team: home_team)
    expect(stat_for(away_skater)).to have_attributes(corsi_against: 2, fenwick_against: 1)
  end

  it "scores xG only on the unblocked attempt, using the active xg_model's coefficients" do
    described_class.new(game: game).call

    expect(stat_for(home_skater_a).xg_for.to_f).to eq(0.5)
    expect(stat_for(away_skater).xg_against.to_f).to eq(0.5)
  end

  it "buckets the same totals into the event's strength_state alongside all" do
    described_class.new(game: game).call

    expect(stat_for(home_skater_a, strength_state: "5v5").corsi_for).to eq(2)
  end

  it "still records a row for a skater who was on the ice but not involved in any shot attempt" do
    described_class.new(game: game).call

    expect(stat_for(home_skater_bench)).to have_attributes(corsi_for: 0, toi_seconds: 100)
  end

  it "excludes goalies entirely" do
    described_class.new(game: game).call

    expect(stat_for(away_goalie)).to be_nil
  end

  it "rolls up team-level Corsi/Fenwick/xG for both teams" do
    described_class.new(game: game).call

    home = TeamGameAdvancedStat.find_by(game: game, team: home_team, strength_state: "all")
    away = TeamGameAdvancedStat.find_by(game: game, team: away_team, strength_state: "all")
    expect(home.corsi_for).to eq(2)
    expect(away.corsi_against).to eq(2)
  end

  it "is safe to re-run: totals never double-count" do
    2.times { described_class.new(game: game).call }

    expect(stat_for(home_skater_a).corsi_for).to eq(2)
  end

  it "raises when there's no active xg_model" do
    XgModel.update_all(active: false)

    expect { described_class.new(game: game) }.to raise_error(ArgumentError, /active xg_model/)
  end
end
