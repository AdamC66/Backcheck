# xG model training (`ml/`)

The one-off Python used to fit Backcheck's expected-goals model. **Not a service, not
in Docker, not on CI** — the first and only Python in this repo. It runs on a laptop,
by hand, once per retrain (season-to-season, not game-to-game — the training data is
static until new games are ingested).

Everything that touches the database is a Rails rake task. Python never connects to
Postgres — it reads a CSV and writes a JSON. That keeps the export deterministic and
testable in RSpec, and keeps this directory a pure fit function.

## Setup

Requires Python 3.9+ (the repo was set up against the system `python3`, 3.9.6).

```
cd ml
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

`requirements.txt` is a full transitive lock, so the install — and therefore the fit —
reproduces exactly.

## Workflow

```
# 1. Export the training set from the dev database (Rails, in backend/).
#    Writes ml/data/training_set.csv + a manifest, and creates an xg_training_runs
#    row (status: exported) so the export is visible in the admin UI immediately.
cd ../backend && bin/rails 'xg:export_training_set'

# 2. Fit. Reads the CSV, writes ml/out/<label>.json (coefficients + validation
#    metrics + calibration bins + held-out sample-game xG totals). Validation is
#    season-held-out (3-fold over the 3 ingested seasons), never a random shot split.
cd ../ml && .venv/bin/python fit.py --features baseline   --label baseline
             .venv/bin/python fit.py --features full       --label v1-full

# 3. Import the fit into a fitted xg_training_runs row (matched to the export by CSV
#    checksum). The admin page then renders its calibration curve, Brier/log-loss,
#    and held-out sample games.
cd ../backend && bin/rails 'xg:import_run[../ml/out/v1-full.json]'

# 4. Activate — promotes the run to a new XgModel row and swaps it in atomically,
#    then enqueues the historical backfill as a SyncRun. (TASK-144, not built yet.)
bin/rails 'xg:activate[v1-full]'
```

The `bin/rails` calls need the dev database env — either run them through the repo
`Makefile` targets, or prefix `DATABASE_HOST=localhost DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres` (see `backend/.env`).

## Files

| Path | What |
|---|---|
| `data/training_set.csv` | one row per Fenwick shot event — distance, angle, shot_type, strength_state, danger-zone bucket, rebound flag, season, goal/no-goal label. Git-ignored. |
| `data/training_set.json` | export manifest — row/goal counts, per-season breakdown, feature columns, CSV sha256. |
| `out/<label>.json` | a fit's output — coefficients (flat keys matching `XgModel.coefficients`), metrics, calibration bins, sample held-out games. Git-ignored. |
| `fit.py` | the training script (TASK-141 / TASK-142). |
