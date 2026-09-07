namespace :xg do
  desc "Export the xG training set to CSV and record an xg_training_runs row. Read-only, " \
       "no NHL API call. Default path: ml/data/training_set.csv. " \
       "Usage: rake xg:export_training_set or rake 'xg:export_training_set[/tmp/other.csv]'"
  task :export_training_set, [ :path ] => :environment do |_task, args|
    path = args[:path].presence || Rails.root.join("../ml/data/training_set.csv")
    run = ExportXgTrainingSet.new(path: path).call

    puts "Wrote #{run.row_count} rows (#{run.goal_count} goals) to #{run.csv_path}"
    puts "sha256  #{run.csv_sha256}"
    puts "xg_training_runs ##{run.id} (#{run.status_name})"
    run.manifest["per_season"].each do |season, counts|
      puts "  #{season}  #{counts['shots']} shots / #{counts['goals']} goals"
    end
  end
end
