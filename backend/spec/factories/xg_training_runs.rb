FactoryBot.define do
  factory :xg_training_run do
    status { XgTrainingRun::STATUSES[:exported] }
    sequence(:csv_path) { |n| "/tmp/training_set_#{n}.csv" }
    csv_sha256 { Digest::SHA256.hexdigest("stub") }
    row_count { 1000 }
    goal_count { 72 }
    manifest { { "feature_columns" => ExportXgTrainingSet::COLUMNS.map(&:to_s) } }
  end
end
