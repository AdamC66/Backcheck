require "rails_helper"

RSpec.describe ReboundShots do
  let(:game) { create(:game) }

  def event(type, period:, seconds:, team: game.home_team)
    create(:game_event, game: game, team: team, event_type: GameEvent::EVENT_TYPES[type],
           period: period, period_time_seconds: seconds)
  end

  it "flags each event in a constructed sequence exactly as expected" do
    first        = event(:shot, period: 1, seconds: 100)
    quick_follow = event(:shot, period: 1, seconds: 102)
    scramble     = event(:missed_shot, period: 1, seconds: 104)
    reset        = event(:shot, period: 1, seconds: 110)
    rebound_goal = event(:goal, period: 1, seconds: 112)

    other_team   = event(:shot, period: 1, seconds: 103, team: game.away_team)
    next_period  = event(:shot, period: 2, seconds: 2)

    after_goal   = event(:goal, period: 3, seconds: 200)
    off_the_goal = event(:shot, period: 3, seconds: 202)

    blocked      = event(:blocked_shot, period: 4, seconds: 50)
    after_block  = event(:shot, period: 4, seconds: 52)

    subject = described_class.new(game)

    expect(subject.rebound?(first)).to be(false)
    expect(subject.rebound?(quick_follow)).to be(true)
    expect(subject.rebound?(scramble)).to be(true)
    expect(subject.rebound?(reset)).to be(false)
    expect(subject.rebound?(rebound_goal)).to be(true)
    expect(subject.rebound?(other_team)).to be(false)
    expect(subject.rebound?(next_period)).to be(false)
    expect(subject.rebound?(after_goal)).to be(false)
    expect(subject.rebound?(off_the_goal)).to be(false)
    expect(subject.rebound?(after_block)).to be(false)
  end

  it "does not flag a shot just outside the window" do
    event(:shot, period: 1, seconds: 300)
    late = event(:shot, period: 1, seconds: 304)

    expect(described_class.new(game).rebound?(late)).to be(false)
  end
end
