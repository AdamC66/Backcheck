require "rails_helper"

RSpec.describe SyncGameEventsJob do
  it "runs SyncGameEvents for the given game through the ingest queue" do
    game = create(:game)

    expect(SyncGameEvents).to receive(:new).with(game: game).and_return(
      instance_double(SyncGameEvents, call: [], missing_players: [])
    )
    described_class.new.perform(game.id)

    expect(described_class.new.queue_name).to eq("ingest")
  end
end
