# Vercel Runtime Artifacts Fix

## What Changed

The Git ignore rules now allow only the small runtime dashboard artifacts from `data/processed/` to be committed.

Large generated files, model training files, caches, and raw datasets remain ignored.

## Where It Changed

The allow-list was added in `.gitignore`.

The deployment troubleshooting note was updated in `README.md`.

This note lives in `readme_vercel_runtime_artifacts.md`.

## Why It Helps

The deployed Vercel app was returning `missing_artifacts` because `data/processed/` was fully ignored and none of the dashboard files were included in the deployed branch.

The FastAPI dashboard needs these runtime files:

```text
cell_cii.parquet
forecast_predictions.parquet
deployment_plan.parquet
reactive_deployment_plan.parquet
forecast_feature_importance.csv
forecast_ranker_feature_importance.csv
forecast_model_metadata.json
backtest_metrics.json
roi_metrics.json
```

These are small enough for deployment and are required for map cells, deployed places, CII relief, hotspot details, and AI trust metrics.

## What Should Happen Next

Stage the allow-listed artifacts with the code changes.

Commit and push the branch.

Redeploy Vercel and confirm `/api/health` returns `status: ready`.
