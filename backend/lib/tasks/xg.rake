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

  desc "Load ml/fit.py's JSON output into a fitted xg_training_runs row so it shows on " \
       "the /admin/xg-model page. Usage: rake 'xg:import_run[../ml/out/baseline.json]'"
  task :import_run, [ :path ] => :environment do |_task, args|
    abort("Usage: rake 'xg:import_run[path/to/fit.json]'") if args[:path].blank?

    run = ImportXgTrainingRun.new(path: args[:path]).call
    metrics = run.metrics || {}

    puts "xg_training_runs ##{run.id} (#{run.status_name}) — #{run.label}"
    puts "  features: #{run.feature_set&.join(', ')}"
    puts "  Brier #{metrics['brier']}  log loss #{metrics['log_loss']}"
  end

  desc "Promote a fitted training run to a new active XgModel. " \
       "Usage: rake 'xg:activate[v1-full]' or rake 'xg:activate[v1-full,v1]' to set the version explicitly"
  task :activate, [ :label, :version ] => :environment do |_task, args|
    abort("Usage: rake 'xg:activate[label]'") if args[:label].blank?

    model = ActivateXgModel.new(label: args[:label], version: args[:version]).call

    puts "Activated XgModel #{model.version} (##{model.id}) — #{model.coefficients.size} coefficients"
    puts "Historical player/team advanced-stat rows still carry the previous model — " \
         "run the TASK-145 backfill to bring them onto #{model.version}."
  end
end
