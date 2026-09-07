require "rails_helper"
require "tmpdir"

RSpec.describe ImportXgTrainingRun do
  let(:sha) { Digest::SHA256.hexdigest("training-set") }
  let(:game) { create(:game) }

  let(:fit) do
    {
      label: "baseline",
      feature_set: %w[distance angle],
      csv_sha256: sha,
      trained_rows: 351_052,
      coefficients: { intercept: -1.17, distance: -0.032, angle: -0.84 },
      metrics: { brier: 0.0637, log_loss: 0.242, by_season: {} },
      calibration: [ { predicted: 0.05, observed: 0.048, count: 35_000 } ],
      sample_games: [ { game_id: game.id, team_id: game.home_team_id, xg: 3.1, goals: 2 } ]
    }
  end

  around do |example|
    Dir.mktmpdir { |dir| @path = File.join(dir, "baseline.json"); example.run }
  end

  before do
    create(:xg_training_run, csv_sha256: sha, csv_path: "/app/ml/data/training_set.csv",
           status: XgTrainingRun::STATUSES[:exported], row_count: 373_376, goal_count: 26_481)
    File.write(@path, fit.to_json)
  end

  it "creates a fitted run from the matching export and enriches the sample games" do
    run = described_class.new(path: @path).call

    expect(run.status_name).to eq(:fitted)
    expect(run.label).to eq("baseline")
    expect(run.csv_path).to eq("/app/ml/data/training_set.csv")
    expect(run.coefficients).to include("angle" => -0.84)
    expect(run.metrics).to include("brier" => 0.0637)

    sample = run.sample_games.first
    expect(sample).to include("xg" => 3.1, "team" => game.home_team.abbreviation)
    expect(sample["matchup"]).to eq("#{game.away_team.abbreviation} @ #{game.home_team.abbreviation}")
  end

  it "refuses a fit whose checksum matches no exported run" do
    File.write(@path, fit.merge(csv_sha256: "deadbeef").to_json)

    expect { described_class.new(path: @path).call }.to raise_error(described_class::Error, /no exported run/)
  end
end
