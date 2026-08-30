require "rails_helper"

RSpec.describe GameScoreTimeline do
  let(:game) { create(:game) }

  def goal(period:, seconds:, team:)
    create(:game_event, game: game, team: team, event_type: GameEvent::EVENT_TYPES[:goal],
           period: period, period_time_seconds: seconds)
  end

  it "counts only the goals scored strictly before an event" do
    goal(period: 1, seconds: 100, team: game.home_team)
    goal(period: 2, seconds: 100, team: game.home_team)
    shot = create(:game_event, game: game, period: 2, period_time_seconds: 300)

    expect(described_class.new(game).score_before(shot)).to eq([ 2, 0 ])
  end

  it "treats a two-goal lead in regulation as not close" do
    goal(period: 1, seconds: 100, team: game.home_team)
    goal(period: 1, seconds: 200, team: game.home_team)
    shot = create(:game_event, game: game, period: 2, period_time_seconds: 300)

    expect(described_class.new(game).close?(shot)).to be(false)
  end
end
