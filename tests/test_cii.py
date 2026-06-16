import pandas as pd
import pytest
from src.cii import score_unit_impact, apply_road_impact

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
    # cell1: 1.0 / (1^1) = 1.0
    # cell2: 1.0 / (4^1) = 0.25
    assert weighted.loc[0, "weighted_impact"] == 1.0
    assert weighted.loc[1, "weighted_impact"] == 0.25

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
