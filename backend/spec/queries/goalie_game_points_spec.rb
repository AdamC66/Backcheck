require "rails_helper"

RSpec.describe GoalieGamePoints do
  let(:game) { create(:game) }
  let(:goalie) { create(:player, position: Player::POSITIONS[:goalie]) }

  it "counts a goal-type event's primary_player as a goal, secondary/tertiary as an assist" do
    create(:game_event, game: game, event_type: GameEvent::EVENT_TYPES[:goal], primary_player: goalie)
    create(:game_event, game: game, event_type: GameEvent::EVENT_TYPES[:goal],
           primary_player: create(:player), secondary_player: goalie)
    create(:game_event, game: game, event_type: GameEvent::EVENT_TYPES[:goal],
           primary_player: create(:player), tertiary_player: goalie)
    create(:game_event, game: game, event_type: GameEvent::EVENT_TYPES[:shot], primary_player: goalie)

    points = described_class.new(game: game, player: goalie)

    expect(points.goals).to eq(1)
    expect(points.assists).to eq(2)
  end

  it "is zero when no play-by-play exists for the game yet" do
    points = described_class.new(game: game, player: goalie)

    expect(points.goals).to eq(0)
    expect(points.assists).to eq(0)
  end

  # Regression guard for TASK-101: #goals and #assists shared one query, not two.
  it "issues one query total across both #goals and #assists" do
    create(:game_event, game: game, event_type: GameEvent::EVENT_TYPES[:goal], primary_player: goalie)
    points = described_class.new(game: game, player: goalie)

    queries = 0
    counter = ->(*) { queries += 1 }
    ActiveSupport::Notifications.subscribed(counter, "sql.active_record") do
      points.goals
      points.assists
    end

    expect(queries).to eq(1)
  end
end
