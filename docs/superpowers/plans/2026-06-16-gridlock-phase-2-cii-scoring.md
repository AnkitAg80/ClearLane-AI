# Phase 2 — Congestion Intensity Index (CII) Scoring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Calculate the Congestion Intensity Index (CII) for every H3 cell and time window, weighting raw violation counts by vehicle size (PCU), violation severity, road capacity, and rush-hour demand.

**Architecture:** A scoring module `src/cii.py` that processes exploded violations, joins road context, and applies mathematical weights defined in `config.yaml`. The pipeline writes `cell_cii.parquet` as the primary artifact for the dashboard.

**Tech Stack:** Python 3.14, pandas, numpy, pyyaml, pyarrow, pytest.

---

## File Structure (modified/created in this phase)

```
gridlock/
  config.yaml                 # + cii weights (rush, recurrence)
  src/
    cii.py                    # scoring logic
    pipeline.py               # integrate cii step
  tests/
    test_cii.py               # scoring logic tests
```

---

### Task 1: CII Configuration and Weights

**Files:**
- Modify: `config.yaml`
- Test: `tests/test_config.py`

- [ ] **Step 1: Add `cii` section to `config.yaml`**

```yaml
cii:
  rush_hour_weights:
    default: 1.0
    morning_peak: {start: 8, end: 11, weight: 2.0}
    evening_peak: {start: 17, end: 21, weight: 2.5}
  recurrence_bonus:
    threshold_days: 5
    multiplier: 1.5
  capacity_weight_power: 0.5  # scaling for 1/lanes
```

- [ ] **Step 2: Update `tests/test_config.py` to verify cii section**

```python
def test_config_has_cii_section():
    cfg = config.load()
    assert "cii" in cfg
    assert cfg["cii"]["rush_hour_weights"]["morning_peak"]["weight"] == 2.0
    assert cfg["cii"]["recurrence_bonus"]["multiplier"] == 1.5
```

- [ ] **Step 3: Run tests**

Run: `python -m pytest tests/test_config.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add config.yaml tests/test_config.py
git commit -m "chore: add CII weights to config" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Unit Impact Scoring (PCU × Severity)

**Files:**
- Create: `src/cii.py`
- Test: `tests/test_cii.py`

- [ ] **Step 1: Write the failing test** — `tests/test_cii.py`

```python
import pandas as pd
import pytest
from src.cii import score_unit_impact

def test_score_unit_impact_calculates_pcu_x_severity():
    df = pd.DataFrame([
        {"id": "V1", "vehicle_type": "CAR", "violation": "WRONG PARKING"},
        {"id": "V2", "vehicle_type": "SCOOTER", "violation": "DOUBLE PARKING"},
    ])
    cfg = {
        "pcu": {"CAR": 1.0, "SCOOTER": 0.3, "_default": 1.0},
        "severity": {"WRONG PARKING": 1.0, "DOUBLE PARKING": 1.7, "_default": 1.0}
    }
    scored = score_unit_impact(df, cfg)
    # V1: 1.0 * 1.0 = 1.0
    # V2: 0.3 * 1.7 = 0.51
    assert scored.loc[0, "unit_impact"] == 1.0
    assert round(scored.loc[1, "unit_impact"], 2) == 0.51
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_cii.py -v`
Expected: FAIL (ModuleNotFoundError)

- [ ] **Step 3: Write minimal implementation** — `src/cii.py`

```python
def score_unit_impact(df, cfg):
    """Calculate ι(v) baseline: PCU(vehicle) × severity(type)."""
    pcu_map = cfg["pcu"]
    sev_map = cfg["severity"]
    
    df = df.copy()
    df["pcu"] = df["vehicle_type"].map(pcu_map).fillna(pcu_map["_default"])
    df["severity"] = df["violation"].map(sev_map).fillna(sev_map["_default"])
    df["unit_impact"] = df["pcu"] * df["severity"]
    return df
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_cii.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/cii.py tests/test_cii.py
git commit -m "feat: unit impact scoring (PCU x Severity)" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Capacity Loss (Road Context)

**Files:**
- Modify: `src/cii.py`
- Test: `tests/test_cii.py`

- [ ] **Step 1: Write the failing test** — `tests/test_cii.py`

```python
from src.cii import apply_road_impact

def test_apply_road_impact_weights_by_lanes():
    df = pd.DataFrame([
        {"h3": "cell1", "unit_impact": 1.0},
        {"h3": "cell2", "unit_impact": 1.0},
    ])
    road_df = pd.DataFrame([
        {"h3": "cell1", "lanes": 1},
        {"h3": "cell2", "lanes": 4},
    ])
    cfg = {"cii": {"capacity_weight_power": 1.0}}
    weighted = apply_road_impact(df, road_df, cfg)
    # cell1: 1.0 * (1/1) = 1.0
    # cell2: 1.0 * (1/4) = 0.25
    assert weighted.loc[0, "weighted_impact"] == 1.0
    assert weighted.loc[1, "weighted_impact"] == 0.25
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_cii.py -v`
Expected: FAIL (AttributeError)

- [ ] **Step 3: Write minimal implementation** — `src/cii.py`

```python
def apply_road_impact(df, road_df, cfg):
    """Adjust impact by road capacity: weighted = unit_impact / (lanes ^ power)."""
    power = cfg["cii"].get("capacity_weight_power", 0.5)
    
    # Merge road context; default to 1 lane if missing
    df = df.merge(road_df[["h3", "lanes"]], on="h3", how="left")
    df["lanes"] = df["lanes"].fillna(1).clip(lower=1)
    
    df["weighted_impact"] = df["unit_impact"] / (df["lanes"] ** power)
    return df
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_cii.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/cii.py tests/test_cii.py
git commit -m "feat: road-capacity weighted impact (1/lanes)" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Temporal Demand and Chronic Weighting

**Files:**
- Modify: `src/cii.py`
- Test: `tests/test_cii.py`

- [ ] **Step 1: Write the failing test** — `tests/test_cii.py`

```python
from src.cii import calculate_cii

def test_calculate_cii_applies_rush_and_chronic_weights():
    # cell1 has 2 violations in morning peak (2.0 weight)
    # cell1 has violations on 6 different days (chronic multiplier 1.5)
    df = pd.DataFrame([
        {"h3": "cell1", "hour": 9, "dow": 0, "weighted_impact": 1.0, "created_datetime": pd.Timestamp("2024-01-01")},
        {"h3": "cell1", "hour": 9, "dow": 0, "weighted_impact": 1.0, "created_datetime": pd.Timestamp("2024-01-02")},
        {"h3": "cell1", "hour": 9, "dow": 0, "weighted_impact": 1.0, "created_datetime": pd.Timestamp("2024-01-03")},
        {"h3": "cell1", "hour": 9, "dow": 0, "weighted_impact": 1.0, "created_datetime": pd.Timestamp("2024-01-04")},
        {"h3": "cell1", "hour": 9, "dow": 0, "weighted_impact": 1.0, "created_datetime": pd.Timestamp("2024-01-05")},
        {"h3": "cell1", "hour": 9, "dow": 0, "weighted_impact": 1.0, "created_datetime": pd.Timestamp("2024-01-06")},
    ])
    cfg = {
        "cii": {
            "rush_hour_weights": {
                "morning_peak": {"start": 8, "end": 11, "weight": 2.0},
                "default": 1.0
            },
            "recurrence_bonus": {"threshold_days": 5, "multiplier": 1.5}
        }
    }
    cii_df = calculate_cii(df, cfg)
    # Impact = Sum(1.0) * rush(2.0) * chronic(1.5) = 6 * 2.0 * 1.5 = 18.0
    assert cii_df.loc[0, "cii"] == 18.0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_cii.py -v`
Expected: FAIL (AttributeError)

- [ ] **Step 3: Write minimal implementation** — `src/cii.py`

```python
def calculate_cii(df, cfg):
    """Aggregate to (h3, hour, dow) and apply temporal/chronic multipliers."""
    cii_cfg = cfg["cii"]
    
    # 1. Temporal Weighting
    def get_rush_weight(hour):
        weights = cii_cfg["rush_hour_weights"]
        for peak_name, peak_cfg in weights.items():
            if peak_name == "default": continue
            if peak_cfg["start"] <= hour < peak_cfg["end"]:
                return peak_cfg["weight"]
        return weights.get("default", 1.0)

    df = df.copy()
    df["rush_weight"] = df["hour"].apply(get_rush_weight)
    
    # 2. Chronic Weighting (Recurrence)
    cell_days = df.groupby("h3")["created_datetime"].apply(lambda x: x.dt.date.nunique())
    bonus_cfg = cii_cfg["recurrence_bonus"]
    chronic_mult = cell_days.apply(
        lambda d: bonus_cfg["multiplier"] if d >= bonus_cfg["threshold_days"] else 1.0
    ).reset_index(name="chronic_weight")
    
    # 3. Aggregation
    cii_df = df.groupby(["h3", "hour", "dow"]).agg({
        "weighted_impact": "sum",
        "rush_weight": "first"
    }).reset_index()
    
    cii_df = cii_df.merge(chronic_mult, on="h3", how="left")
    cii_df["cii"] = cii_df["weighted_impact"] * cii_df["rush_weight"] * cii_df["chronic_weight"]
    
    return cii_df
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_cii.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/cii.py tests/test_cii.py
git commit -m "feat: temporal demand and chronic recurrence multipliers" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Pipeline Integration

**Files:**
- Modify: `src/pipeline.py`
- Test: `tests/test_pipeline.py`

- [ ] **Step 1: Write the failing test** — `tests/test_pipeline.py` (extend)

```python
def test_pipeline_writes_cii_artifact(tmp_path, sample_csv):
    # Existing test setup from test_pipeline.py
    # ... (assume cfg is setup)
    # After run(cfg):
    # assert os.path.exists(os.path.join(out, "cell_cii.parquet"))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_pipeline.py -v`
Expected: FAIL

- [ ] **Step 3: Modify `src/pipeline.py`**

```python
from src.aggregate import explode_violations
from src.cii import score_unit_impact, apply_road_impact, calculate_cii
from src.providers.road_context import road_context_for_cells

def run(cfg, sample=None, with_roadctx=True, with_mappls=False):
    # ... (existing steps)
    
    # 1. Explode and score
    e = explode_violations(df)
    e = score_unit_impact(e, cfg)
    
    # 2. Road context (from provider)
    client = MapplsClient(cache_dir=cfg["mappls"]["cache_dir"]) if with_mappls else None
    road_df = road_context_for_cells(tot["h3"].tolist(), cfg, client)
    
    # 3. CII calculation
    e = apply_road_impact(e, road_df, cfg)
    cii_df = calculate_cii(e, cfg)
    
    # 4. Write artifact
    cii_df.to_parquet(os.path.join(out, "cell_cii.parquet"))
    
    return {"cell_time_counts": ctc, "cell_totals": tot, "station_totals": stn, "cell_cii": cii_df}
```

- [ ] **Step 4: Run the full suite**

Run: `python -m pytest -q`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/pipeline.py tests/test_pipeline.py
git commit -m "feat: integrate CII scoring into pipeline" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Phase 2 Definition of Done

- `python -m pytest -v` all green.
- `python -m src.pipeline --sample 20000` writes `cell_cii.parquet`.
- `cell_cii.parquet` contains `cii` column with non-zero values.
- CII correctly differentiates impact (e.g., peak hour violations > off-peak).
