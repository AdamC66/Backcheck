require "rails_helper"

RSpec.describe GameEvent, type: :model do
  it "is valid with a game, a team that played in it, and a primary player" do
    expect(build(:game_event)).to be_valid
  end

  it "allows a nil team for events with no clean attribution" do
    expect(build(:game_event, team: nil)).to be_valid
  end

  it "rejects a team that didn't play in the game" do
    event = build(:game_event, team: create(:team))

    expect(event).not_to be_valid
    expect(event.errors[:team]).to include("must be one of the game's two teams")
  end

  it "requires nhl_event_id to be unique within a game" do
    existing = create(:game_event)

    dup = build(:game_event, game: existing.game, nhl_event_id: existing.nhl_event_id)

    expect(dup).not_to be_valid
  end
end
