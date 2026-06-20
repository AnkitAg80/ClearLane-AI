import pandas as pd
import pytest
from src.cii import score_unit_impact, apply_road_impact, calculate_cii

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


def test_score_unit_impact_applies_validation_weight():
    df = pd.DataFrame([
        {"id": "V1", "vehicle_type": "CAR", "violation": "WRONG PARKING", "validation_status": "approved"},
        {"id": "V2", "vehicle_type": "CAR", "violation": "WRONG PARKING", "validation_status": "rejected"},
        {"id": "V3", "vehicle_type": "CAR", "violation": "WRONG PARKING", "validation_status": pd.NA},
    ])
    cfg = {
        "pcu": {"CAR": 1.0, "_default": 1.0},
        "severity": {"WRONG PARKING": 1.0, "_default": 1.0},
        "validation_weights": {"approved": 1.0, "rejected": 0.2, "_unknown": 0.7}
    }
    scored = score_unit_impact(df, cfg)
    assert list(scored["validation_weight"]) == [1.0, 0.2, 0.7]
    assert list(scored["unit_impact"]) == [1.0, 0.2, 0.7]

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


def test_calculate_cii_applies_bpr_delay_factor():
    df = pd.DataFrame([
        {"h3": "cell1", "hour": 9, "dow": 0, "weighted_impact": 20.0, "lanes": 1, "created_datetime": pd.Timestamp("2024-01-01")},
        {"h3": "cell2", "hour": 9, "dow": 0, "weighted_impact": 20.0, "lanes": 2, "created_datetime": pd.Timestamp("2024-01-01")},
    ])
    cfg = {
        "cii": {
            "rush_hour_weights": {"default": 1.0},
            "recurrence_bonus": {"threshold_days": 5, "multiplier": 1.5},
            "capacity_model": "bpr",
            "bpr_alpha": 0.15,
            "bpr_beta": 4,
            "lane_capacity_proxy": 10,
        }
    }
    cii_df = calculate_cii(df, cfg).set_index("h3")
    assert cii_df.loc["cell1", "capacity_delay_factor"] == 1.0 + 0.15 * (20.0 / 10.0) ** 4
    assert cii_df.loc["cell2", "capacity_delay_factor"] == 1.0 + 0.15 * (20.0 / 20.0) ** 4
    assert cii_df.loc["cell1", "cii"] > cii_df.loc["cell2", "cii"]

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


def test_calculate_cii_exposes_components_and_confidence():
    df = pd.DataFrame([
        {"h3": "cell1", "hour": 9, "dow": 0, "weighted_impact": 2.0, "lanes": 1,
         "created_datetime": pd.Timestamp("2024-01-01"), "validation_weight": 1.0},
        {"h3": "cell1", "hour": 9, "dow": 0, "weighted_impact": 1.0, "lanes": 1,
         "created_datetime": pd.Timestamp("2024-01-02"), "validation_weight": 0.5},
    ])
    cfg = {
        "cii": {
            "rush_hour_weights": {"morning_peak": {"start": 8, "end": 11, "weight": 2.0}, "default": 1.0},
            "recurrence_bonus": {"threshold_days": 5, "multiplier": 1.5},
            "capacity_model": "bpr",
            "bpr_alpha": 0.15,
            "bpr_beta": 4,
            "lane_capacity_proxy": 100,
            "bpr_ratio_cap": 3.0,
        }
    }
    cii_df = calculate_cii(df, cfg)
    for col in ["base_impact", "capacity_component", "temporal_component", "chronic_component", "confidence_score"]:
        assert col in cii_df.columns
    assert cii_df.loc[0, "base_impact"] == 3.0
    assert cii_df.loc[0, "temporal_component"] == 2.0
    assert cii_df.loc[0, "confidence_score"] == 0.75


def test_calculate_cii_final_contract_columns():
    df = pd.DataFrame([
        {"h3": "cell1", "hour": 9, "dow": 0, "weighted_impact": 5.0, "lanes": 2,
         "created_datetime": pd.Timestamp("2024-01-01"), "validation_weight": 1.0},
    ])
    cfg = {
        "cii": {
            "rush_hour_weights": {"morning_peak": {"start": 8, "end": 11, "weight": 2.0}, "default": 1.0},
            "recurrence_bonus": {"threshold_days": 5, "multiplier": 1.5},
            "capacity_model": "bpr",
            "bpr_alpha": 0.15,
            "bpr_beta": 4,
            "lane_capacity_proxy": 100,
            "bpr_ratio_cap": 3.0,
        }
    }
    out = calculate_cii(df, cfg)
    required = {
        "base_impact", "capacity_ratio", "capacity_component",
        "temporal_component", "chronic_component", "confidence_score", "cii"
    }
    assert required.issubset(out.columns)
    assert out["capacity_ratio"].between(0, 3.0).all()
    assert out["confidence_score"].between(0, 1).all()
