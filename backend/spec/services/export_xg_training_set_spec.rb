require "rails_helper"
require "tmpdir"

RSpec.describe ExportXgTrainingSet do
  let(:game) { create(:game, game_type: Game::GAME_TYPES[:regular_season]) }

  def event(type, period: 1, seconds: 245)
    create(:game_event, game: game, team: game.home_team, event_type: GameEvent::EVENT_TYPES[type],
           period: period, period_time_seconds: seconds)
  end

  around do |example|
    Dir.mktmpdir { |dir| @path = File.join(dir, "training_set.csv"); example.run }
  end

  it "writes one row per Fenwick event, excluding blocked shots and shootout attempts" do
    goal = event(:goal, seconds: 100)
    shot = event(:shot, seconds: 300)
    missed = event(:missed_shot, seconds: 500)
    blocked = event(:blocked_shot, seconds: 700)
    shootout = event(:shot, period: 5, seconds: 5)

    described_class.new(path: @path).call

    lines = File.readlines(@path, chomp: true)
    expect(lines.first).to eq(described_class::COLUMNS.join(","))

    ids = lines.drop(1).map { |line| line.split(",")[described_class::COLUMNS.index(:event_id)].to_i }
    expect(ids).to contain_exactly(goal.id, shot.id, missed.id)
    expect(ids).not_to include(blocked.id, shootout.id)

    goal_flags = lines.drop(1).to_h { |line| cols = line.split(","); [ cols[4].to_i, cols.last.to_i ] }
    expect(goal_flags[goal.id]).to eq(1)
    expect(goal_flags[shot.id]).to eq(0)
  end

  it "is deterministic — a re-run against the same data produces a byte-identical file" do
    event(:goal, seconds: 100)
    event(:shot, seconds: 300)

    first = described_class.new(path: @path).call
    bytes = File.binread(@path)
    second = described_class.new(path: @path).call

    expect(File.binread(@path)).to eq(bytes)
    expect(first.csv_sha256).to eq(second.csv_sha256)
  end

  it "records an exported XgTrainingRun with the manifest" do
    event(:goal, seconds: 100)
    event(:shot, seconds: 300)

    run = described_class.new(path: @path).call

    expect(run.status_name).to eq(:exported)
    expect(run.row_count).to eq(2)
    expect(run.goal_count).to eq(1)
    expect(run.csv_sha256).to eq(Digest::SHA256.file(@path).hexdigest)
    expect(run.manifest.dig("per_season", game.season.label, "goals")).to eq(1)
  end
end
