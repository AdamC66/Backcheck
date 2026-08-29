require "rails_helper"

RSpec.describe ComputeGameAdvancedStats do
  let(:season) { create(:season) }
  let(:home_team) { create(:team, league: season.league) }
  let(:away_team) { create(:team, league: season.league) }
  let(:game) { create(:game, season: season, home_team: home_team, away_team: away_team) }

  def stat_for(player, strength_state: "all", score_state: "all")
    PlayerGameAdvancedStat.find_by(game: game, player: player, strength_state: strength_state,
                                  score_state: score_state)
  end

  before { create(:xg_model, active: true, coefficients: { intercept: 0, distance: 0, angle: 0 }) }

  context "on-ice attribution and xG" do
    let(:home_skater_a) { create(:player, position: Player::POSITIONS[:center]) }
    let(:home_skater_b) { create(:player, position: Player::POSITIONS[:defense]) }
    let(:home_skater_bench) { create(:player, position: Player::POSITIONS[:center]) }
    let(:away_skater) { create(:player, position: Player::POSITIONS[:defense]) }
    let(:away_goalie) { create(:player, position: Player::POSITIONS[:goalie]) }

    before do
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

      home = TeamGameAdvancedStat.find_by(game: game, team: home_team, strength_state: "all", score_state: "all")
      away = TeamGameAdvancedStat.find_by(game: game, team: away_team, strength_state: "all", score_state: "all")
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

    # Regression guard for TASK-103: player/team rows must write in one statement
    # each, not one per row.
    it "writes player rows and team rows in one statement each, not one per row" do
      player_writes = 0
      team_writes = 0
      counter = lambda do |*, payload|
        player_writes += 1 if payload[:sql] =~ /INSERT INTO "player_game_advanced_stats"/
        team_writes += 1 if payload[:sql] =~ /INSERT INTO "team_game_advanced_stats"/
      end

      ActiveSupport::Notifications.subscribed(counter, "sql.active_record") { described_class.new(game: game).call }

      expect(player_writes).to eq(1)
      expect(team_writes).to eq(1)
      expect(PlayerGameAdvancedStat.where(game: game).count).to be > 1
    end
  end

  context "score_state buckets" do
    let(:home_skater) { create(:player, position: Player::POSITIONS[:center]) }
    let(:away_skater) { create(:player, position: Player::POSITIONS[:defense]) }

    # Score entering each event, and whether it's "close" (within 1 in the 1st/2nd,
    # tied in the 3rd, all of OT regardless of margin):
    #   shot  p1 t50  entering 0-0  -> close (diff 0)
    #   goal  p1 t60  entering 0-0  -> close (diff 0)  [score becomes 1-0]
    #   goal  p1 t70  entering 1-0  -> close (diff 1)  [score becomes 2-0]
    #   shot  p2 t50  entering 2-0  -> NOT close (diff 2, period <= 2)
    #   shot  p4 t10  entering 2-0  -> close (OT always counts, regardless of margin)
    before do
      [ 1, 2, 4 ].each do |period|
        create(:shift, game: game, team: home_team, player: home_skater, period: period,
                      start_time_seconds: 0, end_time_seconds: 200)
        create(:shift, game: game, team: away_team, player: away_skater, period: period,
                      start_time_seconds: 0, end_time_seconds: 200)
      end

      create(:game_event, game: game, team: home_team, primary_player: home_skater,
                          event_type: GameEvent::EVENT_TYPES[:shot], period: 1, period_time_seconds: 50,
                          strength_state: GameEvent::STRENGTH_STATES[:even_strength])
      create(:game_event, game: game, team: home_team, primary_player: home_skater,
                          event_type: GameEvent::EVENT_TYPES[:goal], period: 1, period_time_seconds: 60)
      create(:game_event, game: game, team: home_team, primary_player: home_skater,
                          event_type: GameEvent::EVENT_TYPES[:goal], period: 1, period_time_seconds: 70)
      create(:game_event, game: game, team: home_team, primary_player: home_skater,
                          event_type: GameEvent::EVENT_TYPES[:shot], period: 2, period_time_seconds: 50,
                          strength_state: GameEvent::STRENGTH_STATES[:even_strength])
      create(:game_event, game: game, team: home_team, primary_player: home_skater,
                          event_type: GameEvent::EVENT_TYPES[:shot], period: 4, period_time_seconds: 10,
                          strength_state: GameEvent::STRENGTH_STATES[:even_strength])
    end

    it "credits close-situation attempts into both the all and close buckets, and excludes the blowout one" do
      described_class.new(game: game).call

      expect(stat_for(home_skater, score_state: "all").corsi_for).to eq(5)
      expect(stat_for(home_skater, score_state: "close").corsi_for).to eq(4)
    end

    it "rolls the same score-state split up to the team level" do
      described_class.new(game: game).call

      home_close = TeamGameAdvancedStat.find_by(game: game, team: home_team, strength_state: "all",
                                                score_state: "close")
      expect(home_close.corsi_for).to eq(4)
    end

    it "treats all of overtime as close regardless of the score margin" do
      described_class.new(game: game).call

      away_close = stat_for(away_skater, score_state: "close")
      expect(away_close.corsi_against).to eq(4)
    end
  end
end
