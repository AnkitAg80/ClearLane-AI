# Phase 1 — Data Foundation (change readme)

## WHAT changed
Built the precompute data pipeline that turns the raw ~298k-row parking-violation CSV into clean, H3-binned, road-context-ready aggregate tables (parquet). Six single-responsibility modules + 16 passing tests.

## WHERE (files)
- `src/config.py` — `load()` reads `config.yaml` (tunables: H3 resolution, Bengaluru bbox, PCU weights, severity weights, road lane defaults).
- `src/ingest.py` — `load_violations()`: CSV → clean DataFrame (`"NULL"`→NA, JSON `violation_type` arrays → `violation_list`, numeric/timestamp coercion, vehicle_type normalize, drop missing geo/time, dedupe on `id`).
- `src/geo.py` — `add_h3()`: assigns H3 cell (res 9), filters to the Bengaluru bbox, adds `hour`/`dow`.
- `src/aggregate.py` — `explode_violations`, `cell_time_counts` (per h3×hour×dow), `cell_totals` (per cell), `station_totals` (per police station).
- `src/roadctx.py` — `get_graph()` (OSM drive graph fetch + on-disk cache, offline-safe), `cell_road_context()` (nearest road class + lane count per cell), `_lanes()` (robust lane parser).
- `src/pipeline.py` — `run()` + CLI orchestrating ingest→geo→aggregate→(optional roadctx); writes `data/processed/*.parquet`; flags `--sample N`, `--no-roadctx`.
- `config.yaml`, `requirements.txt`, `.gitignore`.
- `tests/` — `test_config`, `test_ingest` (+ `fixtures/sample_violations.csv`), `test_geo`, `test_aggregate`, `test_roadctx` (offline via monkeypatch), `test_pipeline`.

## HOW it helps
- Produces exactly the artifacts Phase 2 (the Congestion-Impact Index) will consume: `cell_time_counts`, `cell_totals`, `station_totals`, and `cell_road_context`.
- Verified on real data (20k-row sample): 6,531 cell-time rows, 1,156 H3 cells, 54 police stations (matches the dataset's 54 stations).
- Live OSM API validated on a test bbox (303 nodes / 731 edges → `residential`, 1 lane).
- Demo-safe by design: heavy crunch is precomputed to parquet; the OSM graph is cached to disk so the eventual Streamlit app runs offline.

## Environment note
Uses a Python **3.11** virtualenv at `.venv` because `osmnx==1.9.4` requires Python `<3.13` (system Python is 3.14). All deps install cleanly on 3.11.

## How to run
- Tests: `.\.venv\Scripts\python.exe -m pytest -q`
- Pipeline (no OSM, fast): `.\.venv\Scripts\python.exe -m src.pipeline --sample 20000 --no-roadctx`
- Pipeline (with OSM, one-time city graph fetch, needs network): `.\.venv\Scripts\python.exe -m src.pipeline`
