require "rails_helper"

RSpec.describe ActivateXgModel do
  let!(:placeholder) { create(:xg_model, version: "v0-placeholder", active: true) }
  let(:run) do
    create(:xg_training_run, label: "v1-full", status: XgTrainingRun::STATUSES[:fitted],
           coefficients: { "intercept" => -1.5, "distance" => -0.03, "shot_type_slap" => 0.2 })
  end

  it "creates a new model from the run's coefficients and makes it the sole active one" do
    run

    model = described_class.new(label: "v1-full").call

    expect(model.version).to eq("v1-full")
    expect(model.coefficients).to eq(run.coefficients)
    expect(model.active).to be(true)
    expect(placeholder.reload.active).to be(false)
    expect(XgModel.where(active: true).count).to eq(1)
  end

  it "marks the training run promoted and links it to the model" do
    run

    model = described_class.new(label: "v1-full", version: "v1").call

    expect(model.version).to eq("v1")
    expect(run.reload.status_name).to eq(:promoted)
    expect(run.xg_model).to eq(model)
  end

  it "refuses a label with no fitted run" do
    expect { described_class.new(label: "nope").call }.to raise_error(described_class::Error, /no fitted training run/)
  end
end
