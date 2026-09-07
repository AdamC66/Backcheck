"""Fit and validate an xG logistic regression from the training-set CSV.

Reads ml/data/training_set.csv (from `rake xg:export_training_set`), fits a logistic
regression, and writes ml/out/<label>.json for `rake xg:import_run` to load.

Validation is season-held-out: for each ingested season the model is trained on the
others and scored on that one, then the out-of-fold predictions are pooled for the
calibration curve and per-team-per-game xG totals. Shots within a season are not
independent, so a random shot-level split would leak and overstate the fit.

Usage:
    python fit.py --features baseline --label baseline
    python fit.py --features full     --label v1-full
"""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, log_loss

ML_ROOT = Path(__file__).resolve().parent
DEFAULT_CSV = ML_ROOT / "data" / "training_set.csv"
DEFAULT_OUT_DIR = ML_ROOT / "out"

# Numeric columns enter the model as-is; categorical columns are one-hot encoded with
# one reference level dropped (folded into the intercept) so the coefficient set stays
# identifiable and maps directly onto XgModel's weighted-sum-through-sigmoid shape.
FEATURE_SETS = {
    "baseline": {"numeric": ["distance", "angle"], "categorical": []},
    "full": {
        "numeric": ["distance", "angle", "rebound"],
        "categorical": ["shot_type", "strength_state", "danger_zone"],
    },
}

REFERENCE_LEVELS = {
    "shot_type": "wrist",
    "strength_state": "even_strength",
    "danger_zone": "long_range",
}

CALIBRATION_BINS = 10
SAMPLE_GAMES = 24


def build_feature_matrix(df, spec):
    frames = [df[spec["numeric"]].astype(float)]
    for column in spec["categorical"]:
        dummies = pd.get_dummies(df[column], prefix=column).astype(float)
        reference = f"{column}_{REFERENCE_LEVELS[column]}"
        dummies = dummies.drop(columns=[reference], errors="ignore")
        frames.append(dummies)
    return pd.concat(frames, axis=1)


def fit_model(X, y):
    model = LogisticRegression(penalty=None, max_iter=5000)
    model.fit(X, y)
    return model


def out_of_fold_predictions(X, y, seasons):
    predictions = np.zeros(len(y), dtype=float)
    for held_out in np.unique(seasons):
        train = seasons != held_out
        model = fit_model(X[train], y[train])
        predictions[~train] = model.predict_proba(X[~train])[:, 1]
    return predictions


def calibration_curve(predicted, observed):
    frame = pd.DataFrame({"p": predicted, "y": observed})
    frame["bin"] = pd.qcut(frame["p"], CALIBRATION_BINS, duplicates="drop")
    return [
        {
            "predicted": float(group["p"].mean()),
            "observed": float(group["y"].mean()),
            "count": int(len(group)),
        }
        for _, group in frame.groupby("bin", observed=True)
    ]


def per_team_game_xg(predicted, observed, game_ids, team_ids):
    frame = pd.DataFrame({"xg": predicted, "goals": observed, "game_id": game_ids, "team_id": team_ids})
    return frame.groupby(["game_id", "team_id"], as_index=False).agg(xg=("xg", "sum"), goals=("goals", "sum"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--features", choices=sorted(FEATURE_SETS), default="baseline")
    parser.add_argument("--label", required=True)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args()

    csv_path = args.csv
    out_path = args.out or DEFAULT_OUT_DIR / f"{args.label}.json"
    spec = FEATURE_SETS[args.features]

    raw = pd.read_csv(csv_path)
    # Preseason is real 5-on-5 but with AHL/tryout lineups — kept in the export, dropped here.
    df = raw[raw["game_type"] != "preseason"].reset_index(drop=True)

    X = build_feature_matrix(df, spec)
    y = df["is_goal"].to_numpy()
    seasons = df["season"].to_numpy()

    oof = out_of_fold_predictions(X.to_numpy(), y, seasons)

    final_model = fit_model(X.to_numpy(), y)
    coefficients = {"intercept": float(final_model.intercept_[0])}
    for name, weight in zip(X.columns, final_model.coef_[0]):
        coefficients[name] = float(weight)

    by_season = {}
    for held_out in sorted(np.unique(seasons)):
        mask = seasons == held_out
        by_season[held_out] = {
            "brier": float(brier_score_loss(y[mask], oof[mask])),
            "log_loss": float(log_loss(y[mask], oof[mask], labels=[0, 1])),
        }

    game_xg = per_team_game_xg(oof, y, df["game_id"].to_numpy(), df["team_id"].to_numpy())
    sample = game_xg.sample(n=min(SAMPLE_GAMES, len(game_xg)), random_state=0).sort_values("game_id")

    result = {
        "label": args.label,
        "features": args.features,
        "feature_set": list(X.columns),
        "csv_sha256": hashlib.sha256(csv_path.read_bytes()).hexdigest(),
        "trained_rows": int(len(df)),
        "trained_goals": int(y.sum()),
        "coefficients": coefficients,
        "metrics": {
            "brier": float(brier_score_loss(y, oof)),
            "log_loss": float(log_loss(y, oof, labels=[0, 1])),
            "by_season": by_season,
            "goal_rate": float(y.mean()),
            "game_xg_summary": {
                "mean": float(game_xg["xg"].mean()),
                "p05": float(game_xg["xg"].quantile(0.05)),
                "p95": float(game_xg["xg"].quantile(0.95)),
                "min": float(game_xg["xg"].min()),
                "max": float(game_xg["xg"].max()),
            },
        },
        "calibration": calibration_curve(oof, y),
        "sample_games": [
            {"game_id": int(row.game_id), "team_id": int(row.team_id), "xg": float(row.xg), "goals": int(row.goals)}
            for row in sample.itertuples()
        ],
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(result, indent=2) + "\n")

    metrics = result["metrics"]
    print(f"{args.label}: {result['trained_rows']} rows, {len(X.columns)} features")
    print(f"  Brier {metrics['brier']:.5f}  log loss {metrics['log_loss']:.5f}  goal rate {metrics['goal_rate']:.4f}")
    for season, m in by_season.items():
        print(f"  held out {season}: Brier {m['brier']:.5f}  log loss {m['log_loss']:.5f}")
    summary = result["metrics"]["game_xg_summary"]
    print(f"  per-team-per-game xG: mean {summary['mean']:.2f}  90% within [{summary['p05']:.2f}, {summary['p95']:.2f}]")
    print(f"  wrote {out_path}")


if __name__ == "__main__":
    main()
