# Vercel Requirements Split

## What Changed

The Python dependency list was split into lightweight runtime requirements and heavier development/training requirements.

`requirements.txt` now contains only packages needed to serve the FastAPI dashboard on Vercel.

`requirements-dev.txt` now includes the heavier pipeline, model-training, geospatial, testing, and exploratory dependencies.

The old eager `pydeck` import in `src/app_utils.py` was moved inside `get_h3_layer()` so the dashboard runtime does not require PyDeck unless that legacy helper is called.

Local pytest temp folders are now ignored through `.gitignore` with `.pytest_tmp*/`.

## Where It Changed

Runtime dependencies changed in `requirements.txt`.

Development/training dependencies were added in `requirements-dev.txt`.

The lazy PyDeck import changed in `src/app_utils.py`.

The local test-temp ignore rule changed in `.gitignore`.

This note lives in `readme_vercel_requirements_split.md` at the project root.

## Why It Helps

Vercel installs `requirements.txt` during deployment. The previous file included heavy packages such as OSMnx, LightGBM, scikit-learn, Streamlit, PyDeck, and Plotly, which caused the Python serverless bundle to exceed Vercel's storage limit.

Keeping Vercel on the smaller runtime dependency set should reduce deployment size while preserving the full local training workflow through `requirements-dev.txt`.

## What Should Happen Next

Use `pip install -r requirements.txt` for deployment/runtime installs.

Use `pip install -r requirements-dev.txt` for local development, tests, pipeline runs, and model training.
