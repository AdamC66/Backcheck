require "rails_helper"

RSpec.describe RebuildAdvancedStatsJob do
  it "runs RebuildAdvancedStatsForGame for the given game" do
    game = create(:game, stats_syncing: true)

    expect(RebuildAdvancedStatsForGame).to receive(:new).with(game: game).and_call_original
    described_class.new.perform(game.id)

    expect(game.reload.stats_syncing).to be false
  end
end
