# Next-3h Forecast Model

## Target

`target_next_3h_cii` is the sum of hourly CII proxy pressure in the same H3 cell over the next 3 hours. The current hour is excluded to avoid leakage.

## Training Rows

One row equals one H3 cell at one hourly timestamp. Quiet cell-hours are zero-filled so the model learns both hotspots and non-hotspots.

## Feature Families

The model uses calendar features (hour, dow, month, is_weekend), current cell pressure (current_cii, current_violation_count), capacity features (capacity_ratio, current_capacity_ratio, current_capacity_component), temporal memory features (lagged CII at multiple horizons, rolling means, same-hour day-over-day lags, EWM features), streak features (hours_since_last_violation, active_hour_streak, quiet_hour_streak), chronic component, static encodings (location_count_log, station_count_log, junction_count_log, cell_total_rank_pct), support and validation quality metrics, road capacity, and H3 ring spillover features (ring1/ring2 current CII means, roll 3h means, active neighbor counts).

## Model Architecture

Two models are trained:
1. **Regression model** (LGBMRegressor): Predicts continuous `pred_next_3h_cii` values
2. **Ranker model** (LGBMRanker): Produces `rank_score` for relative hotspot ordering within each timestamp

Final deployment scoring blends regression (65%) and rank (35%) scores into `deployment_score`.

## Training Fairness

- Negative sampling uses `negative_sampling_ratio: 4` — at most 4 negative rows per positive row
- Target-aware weights boost high-target rows by `high_target_weight: 5.0`
- Ranker filters out timestamps with fewer than 2 rows (regression-only fallback)
- Strict feature contract: training fails if configured features are missing from the panel

## Commands

Run deterministic tests:

```powershell
.\.venv\Scripts\python.exe -m pytest -q --ignore=tests\test_mappls_live.py
```

Default behavior respects `prepare_only_default: true` in config (builds panel without training):

```powershell
.\.venv\Scripts\python.exe -m src.pipeline --no-roadctx --phase3
```

Force training even when `prepare_only_default` is true:

```powershell
.\.venv\Scripts\python.exe -m src.pipeline --no-roadctx --phase3 --train
```

Train using OSM road context when graph download/cache is available:

```powershell
.\.venv\Scripts\python.exe -m src.pipeline --phase3 --train
```

Inspect metrics:

```powershell
.\.venv\Scripts\python.exe -c "import json, os; out='data/processed'; print(json.load(open(os.path.join(out,'backtest_metrics.json')))); print(json.load(open(os.path.join(out,'roi_metrics.json'))))"
```

Inspect feature importance:

```powershell
.\.venv\Scripts\python.exe -c "import pandas as pd; print(pd.read_csv('data/processed/forecast_feature_importance.csv').head(20).to_string(index=False))"
```

Inspect ranker feature importance:

```powershell
.\.venv\Scripts\python.exe -c "import pandas as pd; print(pd.read_csv('data/processed/forecast_ranker_feature_importance.csv').head(20).to_string(index=False))"
```

Inspect forecast rows:

```powershell
.\.venv\Scripts\python.exe -c "import pandas as pd; pred=pd.read_parquet('data/processed/forecast_predictions.parquet'); print(pred[['h3','timestamp','pred_next_3h_cii','target_next_3h_cii']].head(20).to_string(index=False))"
```

Launch dashboard after training:

```powershell
.\.venv\Scripts\python.exe -m streamlit run app\app.py
```
