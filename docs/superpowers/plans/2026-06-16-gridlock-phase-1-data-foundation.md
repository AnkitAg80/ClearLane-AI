# Gridlock Phase 1 — Data Foundation + Road Context — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the raw 298k-row parking-violation CSV into clean, H3-binned, road-context-enriched aggregate tables written as parquet artifacts.

**Architecture:** A precompute pipeline of small single-responsibility modules (`ingest → geo → aggregate → roadctx`) orchestrated by `pipeline.py`, writing parquet to `data/processed/`. The Streamlit app (later phases) only reads these artifacts. Spec: `docs/superpowers/specs/2026-06-16-gridlock-congestion-prioritizer-design.md`.

**Tech Stack:** Python 3.14, pandas, h3 (v4), osmnx (1.9.4), pyyaml, pyarrow, pytest. (lightgbm/scikit-learn/streamlit/pydeck/plotly listed in requirements now but used in later phases.)

**Convention:** every commit ends with a `-m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"` trailer (shown in each commit step).

---

## File Structure (created in this phase)

```
gridlock/
  config.yaml                 # all tunables
  requirements.txt
  .gitignore
  src/
    __init__.py
    config.py                 # load config.yaml
    ingest.py                 # CSV → clean DataFrame
    geo.py                    # + H3 cell, bbox filter, hour/dow
    aggregate.py              # space×time / station aggregates
    roadctx.py                # OSM road class+lanes per cell (cached)
    pipeline.py               # orchestrate + --sample + write parquet
  tests/
    __init__.py
    conftest.py               # fixture paths
    fixtures/sample_violations.csv
    test_config.py
    test_ingest.py
    test_geo.py
    test_aggregate.py
    test_roadctx.py
    test_pipeline.py
  data/
    processed/                # parquet artifacts (gitignored)
    cache/                    # OSM graphml cache (gitignored)
```

---

### Task 1: Project scaffold, dependencies, config

**Files:**
- Create: `requirements.txt`, `.gitignore`, `config.yaml`, `src/__init__.py`, `tests/__init__.py`, `src/config.py`, `tests/test_config.py`

- [ ] **Step 1: Create `requirements.txt`**

```text
pandas>=2.2
numpy>=1.26
h3>=4.1,<5
osmnx==1.9.4
scikit-learn>=1.4
lightgbm>=4.3
streamlit>=1.36
pydeck>=0.9
plotly>=5.22
pyyaml>=6.0
pyarrow>=16.0
pytest>=8.2
```

- [ ] **Step 2: Create `.gitignore`**

```text
.venv/
__pycache__/
*.pyc
data/processed/
data/cache/
.pytest_cache/
```

- [ ] **Step 3: Create `config.yaml`**

```yaml
data:
  violations_csv: "C:/Users/ankit/Downloads/jan to may police violation_anonymized791b166.csv"
  events_csv: "C:/Users/ankit/Downloads/Astram event data_anonymized - Astram event data_anonymizedb40ac87.csv"
  processed_dir: "data/processed"
  cache_dir: "data/cache"
geo:
  h3_resolution: 9
  bbox:
    north: 13.2
    south: 12.7
    east: 77.8
    west: 77.3
pcu:
  "SCOOTER": 0.3
  "MOTOR CYCLE": 0.3
  "CAR": 1.0
  "PASSENGER AUTO": 0.8
  "MAXI-CAB": 2.0
  "_default": 1.0
severity:
  "WRONG PARKING": 1.0
  "NO PARKING": 1.0
  "PARKING IN A MAIN ROAD": 1.8
  "PARKING NEAR ROAD CROSSING": 2.0
  "PARKING NEAR TRAFFIC LIGHT OR ZEBRA CROSS": 2.0
  "PARKING ON FOOTPATH": 1.3
  "PARKING NEAR BUSTOP/SCHOOL/HOSPITAL ETC": 1.6
  "DOUBLE PARKING": 1.7
  "_default": 1.0
roadctx:
  network_type: "drive"
  lanes_default_by_class:
    motorway: 4
    trunk: 3
    primary: 2
    secondary: 2
    tertiary: 1
    residential: 1
    _default: 1
```

- [ ] **Step 4: Create empty package markers**

`src/__init__.py` and `tests/__init__.py` — both empty files.

- [ ] **Step 5: Write the failing test** — `tests/test_config.py`

```python
from src import config


def test_load_returns_expected_defaults():
    cfg = config.load()
    assert cfg["geo"]["h3_resolution"] == 9
    assert cfg["geo"]["bbox"]["north"] == 13.2
    assert cfg["pcu"]["CAR"] == 1.0
    assert cfg["severity"]["_default"] == 1.0
```

- [ ] **Step 6: Run test to verify it fails**

Run: `python -m pytest tests/test_config.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'src.config'`.

- [ ] **Step 7: Write minimal implementation** — `src/config.py`

```python
import os
import yaml

_DEFAULT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.yaml")


def load(path=_DEFAULT_PATH):
    """Load the YAML config into a plain dict."""
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)
```

- [ ] **Step 8: Install deps and run test to verify it passes**

Run: `python -m pip install -r requirements.txt`
Run: `python -m pytest tests/test_config.py -v`
Expected: PASS (1 passed).

- [ ] **Step 9: Init git and commit**

```bash
git init
git add .
git commit -m "chore: scaffold project, deps, and config loader" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Ingest — load and clean the CSV

**Files:**
- Create: `tests/fixtures/sample_violations.csv`, `tests/conftest.py`, `src/ingest.py`, `tests/test_ingest.py`

- [ ] **Step 1: Create the test fixture** — `tests/fixtures/sample_violations.csv`

Note: `V2` vehicle is lowercase (tests normalization), `V5` is out-of-bbox, `V6` has NULL datetime (tests drop), `V7` has malformed JSON (tests safe parse), `V4` is duplicated (tests dedupe).

```text
id,latitude,longitude,vehicle_type,violation_type,created_datetime,police_station
V1,12.9255567,77.618665,CAR,"[""WRONG PARKING"",""NO PARKING""]",2024-01-02 09:15:00+00,Madiwala
V2,12.9255600,77.6187000,scooter,"[""NO PARKING""]",2024-01-02 09:45:00+00,Madiwala
V3,12.9054633,77.7007781,MAXI-CAB,"[""PARKING IN A MAIN ROAD""]",2024-01-03 18:30:00+00,Bellandur
V4,12.9255570,77.6186600,CAR,"[""WRONG PARKING""]",2024-01-09 09:20:00+00,Madiwala
V5,99.0,99.0,CAR,"[""NO PARKING""]",2024-01-02 10:00:00+00,OutOfBox
V6,12.9255567,77.6186650,CAR,NULL,NULL,Madiwala
V7,12.9255567,77.6186650,CAR,"[malformed",2024-01-02 11:00:00+00,Madiwala
V4,12.9255570,77.6186600,CAR,"[""WRONG PARKING""]",2024-01-09 09:20:00+00,Madiwala
```

- [ ] **Step 2: Create `tests/conftest.py`**

```python
import os
import pytest

FIXTURE_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


@pytest.fixture
def sample_csv():
    return os.path.join(FIXTURE_DIR, "sample_violations.csv")
```

- [ ] **Step 3: Write the failing test** — `tests/test_ingest.py`

```python
import pandas as pd
from src.ingest import load_violations


def test_load_drops_null_datetime_and_dedupes(sample_csv):
    df = load_violations(sample_csv)
    # V6 dropped (NULL datetime), duplicate V4 collapsed -> 6 rows: V1,V2,V3,V4,V5,V7
    assert len(df) == 6
    assert (df["id"] == "V4").sum() == 1
    assert "V6" not in set(df["id"])


def test_violation_arrays_parsed(sample_csv):
    df = load_violations(sample_csv).set_index("id")
    assert df.loc["V1", "violation_list"] == ["WRONG PARKING", "NO PARKING"]
    assert df.loc["V7", "violation_list"] == []  # malformed -> empty


def test_types_coerced_and_normalized(sample_csv):
    df = load_violations(sample_csv).set_index("id")
    assert df.loc["V2", "vehicle_type"] == "SCOOTER"  # uppercased
    assert pd.api.types.is_datetime64_any_dtype(df["created_datetime"])
    assert df.loc["V1", "latitude"] == 12.9255567
```

- [ ] **Step 4: Run test to verify it fails**

Run: `python -m pytest tests/test_ingest.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'src.ingest'`.

- [ ] **Step 5: Write minimal implementation** — `src/ingest.py`

```python
import json
import pandas as pd

NULL_TOKENS = ["NULL", "null", "None", "NaN", ""]


def _parse_violation_types(value):
    """Parse the JSON-array string in violation_type; return [] on any failure."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return []
    try:
        parsed = json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return []
    if not isinstance(parsed, list):
        return []
    return [str(v).strip().upper() for v in parsed]


def load_violations(path):
    """Load the violation CSV and return a cleaned DataFrame.

    - 'NULL'-like tokens -> NA
    - latitude/longitude -> numeric, created_datetime -> tz-aware datetime
    - violation_type JSON -> list column `violation_list`
    - vehicle_type normalized upper; rows missing geo/time dropped; ids deduped
    """
    df = pd.read_csv(path, dtype=str, keep_default_na=False, low_memory=False)
    df = df.replace(NULL_TOKENS, pd.NA)

    df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
    df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
    df["created_datetime"] = pd.to_datetime(df["created_datetime"], errors="coerce", utc=True)
    df["violation_list"] = df["violation_type"].apply(_parse_violation_types)
    df["vehicle_type"] = df["vehicle_type"].str.strip().str.upper()

    df = df.dropna(subset=["latitude", "longitude", "created_datetime"])
    df = df.drop_duplicates(subset=["id"]).reset_index(drop=True)
    return df
```

- [ ] **Step 6: Run test to verify it passes**

Run: `python -m pytest tests/test_ingest.py -v`
Expected: PASS (3 passed).

- [ ] **Step 7: Commit**

```bash
git add tests/fixtures/sample_violations.csv tests/conftest.py src/ingest.py tests/test_ingest.py
git commit -m "feat: ingest module with JSON/NULL/dtype cleaning + dedupe" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Geo — H3 binning, bbox filter, time features

**Files:**
- Create: `src/geo.py`, `tests/test_geo.py`

- [ ] **Step 1: Write the failing test** — `tests/test_geo.py`

```python
import h3
from src.ingest import load_violations
from src.geo import add_h3

BBOX = {"north": 13.2, "south": 12.7, "east": 77.8, "west": 77.3}


def test_out_of_bbox_dropped(sample_csv):
    df = add_h3(load_violations(sample_csv), resolution=9, bbox=BBOX)
    # V5 (99,99) removed; from the 6 ingested rows -> 5 remain
    assert len(df) == 5
    assert "V5" not in set(df["id"])


def test_h3_and_time_features(sample_csv):
    df = add_h3(load_violations(sample_csv), resolution=9, bbox=BBOX).set_index("id")
    expected = h3.latlng_to_cell(12.9255567, 77.618665, 9)
    assert df.loc["V1", "h3"] == expected
    assert df.loc["V1", "hour"] == 9
    assert df.loc["V1", "dow"] == 1  # 2024-01-02 is a Tuesday (Mon=0)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_geo.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'src.geo'`.

- [ ] **Step 3: Write minimal implementation** — `src/geo.py`

```python
import h3


def _in_bbox(lat, lng, bbox):
    return (bbox["south"] <= lat <= bbox["north"]) and (bbox["west"] <= lng <= bbox["east"])


def add_h3(df, resolution, bbox):
    """Filter to bbox, add `h3` cell id and `hour`/`dow` time features."""
    mask = [_in_bbox(lat, lng, bbox) for lat, lng in zip(df["latitude"], df["longitude"])]
    df = df.loc[mask].copy()
    df["h3"] = [h3.latlng_to_cell(lat, lng, resolution)
                for lat, lng in zip(df["latitude"], df["longitude"])]
    df["hour"] = df["created_datetime"].dt.hour
    df["dow"] = df["created_datetime"].dt.dayofweek
    return df.reset_index(drop=True)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_geo.py -v`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add src/geo.py tests/test_geo.py
git commit -m "feat: geo module with H3 binning, bbox filter, time features" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Aggregate — space×time and station rollups

**Files:**
- Create: `src/aggregate.py`, `tests/test_aggregate.py`

- [ ] **Step 1: Write the failing test** — `tests/test_aggregate.py`

```python
from src.ingest import load_violations
from src.geo import add_h3
from src.aggregate import explode_violations, cell_time_counts, cell_totals, station_totals

BBOX = {"north": 13.2, "south": 12.7, "east": 77.8, "west": 77.3}


def _geo(sample_csv):
    return add_h3(load_violations(sample_csv), resolution=9, bbox=BBOX)


def test_explode_drops_empty_lists(sample_csv):
    e = explode_violations(_geo(sample_csv))
    # V1=2, V2=1, V3=1, V4=1, V7=0 -> 5 exploded violation rows
    assert len(e) == 5


def test_cell_time_counts_sum(sample_csv):
    ctc = cell_time_counts(_geo(sample_csv))
    assert ctc["count"].sum() == 5


def test_station_totals(sample_csv):
    st = station_totals(_geo(sample_csv)).set_index("police_station")
    assert st.loc["Madiwala", "violations"] == 4  # V1(2)+V2(1)+V4(1)
    assert st.loc["Bellandur", "violations"] == 1  # V3


def test_cell_totals_sum(sample_csv):
    tot = cell_totals(_geo(sample_csv))
    assert tot["total"].sum() == 5
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_aggregate.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'src.aggregate'`.

- [ ] **Step 3: Write minimal implementation** — `src/aggregate.py`

```python
def explode_violations(df):
    """One row per (record × violation); empty violation lists drop out."""
    e = df.explode("violation_list").rename(columns={"violation_list": "violation"})
    return e.dropna(subset=["violation"]).reset_index(drop=True)


def cell_time_counts(df):
    """Violation counts per (h3, hour, dow)."""
    e = explode_violations(df)
    return e.groupby(["h3", "hour", "dow"]).size().reset_index(name="count")


def cell_totals(df):
    """Total violations per H3 cell."""
    e = explode_violations(df)
    return e.groupby("h3").size().reset_index(name="total")


def station_totals(df):
    """Total violations per police station."""
    e = explode_violations(df)
    return e.groupby("police_station").size().reset_index(name="violations")
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_aggregate.py -v`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add src/aggregate.py tests/test_aggregate.py
git commit -m "feat: aggregate module (cell-time, cell-total, station rollups)" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Road context — OSM road class + lanes per cell (cached, offline-safe)

**Files:**
- Create: `src/roadctx.py`, `tests/test_roadctx.py`

Design note: `cell_road_context` takes an injected graph `G` so tests never hit the network. `get_graph` fetches once then reads the on-disk cache (offline-safe demo). The lane parser `_lanes` is pure and tested directly.

- [ ] **Step 1: Write the failing test** — `tests/test_roadctx.py`

```python
import h3
import networkx as nx
import src.roadctx as rc

DEFAULTS = {"primary": 2, "tertiary": 1, "_default": 1}


def test_lanes_parses_int():
    assert rc._lanes("3", "primary", DEFAULTS) == 3


def test_lanes_takes_first_of_list():
    assert rc._lanes(["2", "3"], "primary", DEFAULTS) == 2


def test_lanes_falls_back_to_class_default():
    assert rc._lanes(None, "tertiary", DEFAULTS) == 1


def test_lanes_falls_back_on_bad_value():
    assert rc._lanes("bad", "unknown", DEFAULTS) == 1


def test_cell_road_context(monkeypatch):
    G = nx.MultiDiGraph()
    G.add_node(1, x=77.700, y=12.905)
    G.add_node(2, x=77.701, y=12.906)
    G.add_edge(1, 2, key=0, highway="primary", lanes="2")
    monkeypatch.setattr(rc.ox.distance, "nearest_edges", lambda graph, X, Y: (1, 2, 0))

    cell = h3.latlng_to_cell(12.905, 77.700, 9)
    out = rc.cell_road_context([cell], G, DEFAULTS).set_index("h3")
    assert out.loc[cell, "road_class"] == "primary"
    assert out.loc[cell, "lanes"] == 2
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_roadctx.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'src.roadctx'`.

- [ ] **Step 3: Write minimal implementation** — `src/roadctx.py`

```python
import os
import h3
import osmnx as ox
import pandas as pd


def get_graph(bbox, network_type, cache_path):
    """Return the drive graph for the bbox, fetching once then reading the cache."""
    if os.path.exists(cache_path):
        return ox.load_graphml(cache_path)
    G = ox.graph_from_bbox(
        bbox["north"], bbox["south"], bbox["east"], bbox["west"],
        network_type=network_type,
    )
    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    ox.save_graphml(G, cache_path)
    return G


def _first(value):
    return value[0] if isinstance(value, list) else value


def _lanes(value, road_class, defaults):
    """Best-effort integer lane count; fall back to per-class default."""
    try:
        return int(_first(value))
    except (TypeError, ValueError):
        rc = _first(road_class)
        return defaults.get(rc, defaults["_default"])


def cell_road_context(cells, G, lane_defaults):
    """Map each H3 cell centroid to its nearest road edge's class and lane count."""
    rows = []
    for cell in cells:
        lat, lng = h3.cell_to_latlng(cell)
        u, v, k = ox.distance.nearest_edges(G, lng, lat)
        data = G.edges[u, v, k]
        road_class = _first(data.get("highway", "_default"))
        rows.append({
            "h3": cell,
            "road_class": road_class,
            "lanes": _lanes(data.get("lanes"), data.get("highway"), lane_defaults),
        })
    return pd.DataFrame(rows)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_roadctx.py -v`
Expected: PASS (5 passed).

- [ ] **Step 5: Commit**

```bash
git add src/roadctx.py tests/test_roadctx.py
git commit -m "feat: roadctx module (OSM road class/lanes per cell, cached)" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Pipeline — orchestrate, sample mode, write artifacts

**Files:**
- Create: `src/pipeline.py`, `tests/test_pipeline.py`

Design note: `run` accepts a config dict (tests pass one pointing at the fixture) and a `with_roadctx` flag so the smoke test skips the network step. Road context is exercised separately in Task 5.

- [ ] **Step 1: Write the failing test** — `tests/test_pipeline.py`

```python
import os
import pandas as pd
from src.pipeline import run


def test_pipeline_writes_artifacts(tmp_path, sample_csv):
    cfg = {
        "data": {
            "violations_csv": sample_csv,
            "processed_dir": str(tmp_path / "processed"),
            "cache_dir": str(tmp_path / "cache"),
        },
        "geo": {"h3_resolution": 9,
                "bbox": {"north": 13.2, "south": 12.7, "east": 77.8, "west": 77.3}},
    }
    result = run(cfg, with_roadctx=False)

    assert result["cell_time_counts"]["count"].sum() == 5
    out = cfg["data"]["processed_dir"]
    for name in ["cell_time_counts", "cell_totals", "station_totals"]:
        path = os.path.join(out, f"{name}.parquet")
        assert os.path.exists(path)
        assert len(pd.read_parquet(path)) > 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_pipeline.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'src.pipeline'`.

- [ ] **Step 3: Write minimal implementation** — `src/pipeline.py`

```python
import argparse
import os

from src import config as config_module
from src.ingest import load_violations
from src.geo import add_h3
from src.aggregate import cell_time_counts, cell_totals, station_totals
from src.roadctx import get_graph, cell_road_context


def run(cfg, sample=None, with_roadctx=True):
    """Run the Phase-1 pipeline; write parquet artifacts; return key tables."""
    df = load_violations(cfg["data"]["violations_csv"])
    if sample:
        df = df.head(sample)
    df = add_h3(df, cfg["geo"]["h3_resolution"], cfg["geo"]["bbox"])

    ctc = cell_time_counts(df)
    tot = cell_totals(df)
    stn = station_totals(df)

    out = cfg["data"]["processed_dir"]
    os.makedirs(out, exist_ok=True)
    ctc.to_parquet(os.path.join(out, "cell_time_counts.parquet"))
    tot.to_parquet(os.path.join(out, "cell_totals.parquet"))
    stn.to_parquet(os.path.join(out, "station_totals.parquet"))

    if with_roadctx:
        cache_path = os.path.join(cfg["data"]["cache_dir"], "bengaluru_drive.graphml")
        G = get_graph(cfg["geo"]["bbox"], cfg["roadctx"]["network_type"], cache_path)
        rc = cell_road_context(tot["h3"].tolist(), G, cfg["roadctx"]["lanes_default_by_class"])
        rc.to_parquet(os.path.join(out, "cell_road_context.parquet"))

    return {"cell_time_counts": ctc, "cell_totals": tot, "station_totals": stn}


def main():
    parser = argparse.ArgumentParser(description="Gridlock Phase-1 pipeline")
    parser.add_argument("--sample", type=int, default=None, help="limit to first N rows")
    parser.add_argument("--no-roadctx", action="store_true", help="skip OSM road context")
    args = parser.parse_args()
    cfg = config_module.load()
    run(cfg, sample=args.sample, with_roadctx=not args.no_roadctx)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_pipeline.py -v`
Expected: PASS (1 passed).

- [ ] **Step 5: Run the full test suite**

Run: `python -m pytest -v`
Expected: PASS (all tests from Tasks 1–6 green).

- [ ] **Step 6: Real-data smoke run (skip OSM the first time)**

Run: `python -m src.pipeline --sample 20000 --no-roadctx`
Expected: no error; `data/processed/cell_time_counts.parquet`, `cell_totals.parquet`, `station_totals.parquet` exist.

- [ ] **Step 7: Build + cache the OSM graph once (needs network)**

Run: `python -m src.pipeline --sample 20000`
Expected: first run downloads the Bengaluru drive graph to `data/cache/bengaluru_drive.graphml` (slow, one-time), writes `cell_road_context.parquet`. Subsequent runs read the cache offline.

- [ ] **Step 8: Commit**

```bash
git add src/pipeline.py tests/test_pipeline.py
git commit -m "feat: pipeline orchestration with sample mode + parquet artifacts" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Phase 1 Definition of Done

- `python -m pytest -v` all green (config, ingest, geo, aggregate, roadctx, pipeline).
- `python -m src.pipeline --sample 20000 --no-roadctx` writes the three core artifacts on real data.
- OSM graph cached once → `cell_road_context.parquet` produced; reruns work offline.
- Six committed modules with single responsibilities, ready for Phase 2 (CII scoring) to consume `data/processed/*.parquet`.
