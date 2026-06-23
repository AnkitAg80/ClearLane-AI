import h3
import pandas as pd
import pytest

from src.temporal_panel import (
    add_spatial_ring_features,
    add_temporal_features,
    build_hourly_panel,
)


def test_build_hourly_panel_zero_fills_cell_hour_grid():
    df = pd.DataFrame([
        {
            "h3": "cell_a",
            "created_datetime": pd.Timestamp("2024-01-01 09:10:00", tz="UTC"),
            "unit_impact": 2.0,
            "weighted_impact": 2.0,
            "lanes": 1,
            "validation_weight": 1.0,
        },
        {
            "h3": "cell_b",
            "created_datetime": pd.Timestamp("2024-01-01 11:20:00", tz="UTC"),
            "unit_impact": 3.0,
            "weighted_impact": 3.0,
            "lanes": 2,
            "validation_weight": 0.5,
        },
    ])
    area = pd.DataFrame([
        {"h3": "cell_a", "record_count": 10, "support_score": 0.5, "data_quality_score": 0.8,
         "approved_rate": 0.7, "rejected_rate": 0.1},
        {"h3": "cell_b", "record_count": 5, "support_score": 0.3, "data_quality_score": 0.6,
         "approved_rate": 0.5, "rejected_rate": 0.2},
    ])
    cfg = {"forecast": {"bucket_freq": "1h"}}

    panel = build_hourly_panel(df, area, cfg)

    assert set(panel["h3"]) == {"cell_a", "cell_b"}
    assert panel["timestamp"].min() == pd.Timestamp("2024-01-01 09:00:00", tz="UTC")
    assert panel["timestamp"].max() == pd.Timestamp("2024-01-01 11:00:00", tz="UTC")
    assert len(panel) == 6
    quiet = panel[(panel["h3"] == "cell_a") & (panel["timestamp"] == pd.Timestamp("2024-01-01 10:00:00", tz="UTC"))].iloc[0]
    assert quiet["current_violation_count"] == 0
    assert quiet["current_cii"] == 0.0
    assert quiet["record_count"] == 10


def test_build_hourly_panel_aggregates_multiple_violations_in_same_cell_hour():
    df = pd.DataFrame([
        {
            "h3": "cell_a",
            "created_datetime": pd.Timestamp("2024-01-01 09:10:00", tz="UTC"),
            "weighted_impact": 2.0,
            "lanes": 2,
            "validation_weight": 0.8,
        },
        {
            "h3": "cell_a",
            "created_datetime": pd.Timestamp("2024-01-01 09:45:00", tz="UTC"),
            "weighted_impact": 3.5,
            "lanes": 3,
            "validation_weight": 0.4,
        },
    ])
    area = pd.DataFrame([{"h3": "cell_a", "record_count": 2, "support_score": 1.0}])

    panel = build_hourly_panel(df, area, {"forecast": {"bucket_freq": "1h"}})

    row = panel.iloc[0]
    assert row["current_violation_count"] == 2
    assert row["current_cii"] == pytest.approx(5.5, abs=0.1)
    assert round(row["confidence_score"], 6) == 0.6


def test_build_hourly_panel_empty_or_invalid_input_returns_expected_schema():
    columns = ["h3", "created_datetime", "weighted_impact", "lanes", "validation_weight"]
    df = pd.DataFrame([
        {"h3": "cell_a", "created_datetime": "not-a-date", "weighted_impact": 1.0, "lanes": 1, "validation_weight": 1.0}
    ], columns=columns)
    area = pd.DataFrame(columns=["h3", "record_count", "support_score", "top_location"])

    panel = build_hourly_panel(df, area, {"forecast": {"bucket_freq": "1h"}})

    expected_columns = [
        "h3", "timestamp", "current_violation_count", "current_cii",
        "current_base_impact", "current_capacity_ratio", "capacity_ratio",
        "current_capacity_component", "current_chronic_component", "current_temporal_component",
        "lanes",
        "confidence_score", "record_count", "support_score", "data_quality_score",
        "approved_rate", "rejected_rate", "location_count", "location_count_log",
        "station_count_log", "no_junction_count", "junction_count_log", "cell_total_rank_pct",
        "violation_total",
        "hour", "dow", "month", "is_weekend",
        "capacity_stolen_pct", "time_to_criticality_mins", "lifecycle_stage",
        "top_location",
    ]
    assert panel.empty
    assert list(panel.columns) == expected_columns


def test_add_temporal_features_adds_same_hour_ewm_and_recency():
    panel = pd.DataFrame({
        "h3": ["cell_a"] * 26,
        "timestamp": pd.date_range("2024-01-01 00:00:00", periods=26, freq="1h", tz="UTC"),
        "current_cii": [0.0] * 24 + [5.0, 7.0],
        "current_violation_count": [0] * 24 + [1, 1],
    })
    cfg = {
        "forecast": {
            "horizon_hours": 3,
            "lag_hours": [1],
            "rolling_windows_hours": [3],
            "same_hour_lags_days": [1],
            "ewm_halflife_hours": [3],
        }
    }
    out = add_temporal_features(panel, cfg)
    row24 = out.iloc[24]
    row25 = out.iloc[25]
    assert row24["cii_same_hour_1d"] == 0.0
    assert row25["hours_since_last_violation"] == 0.0
    assert row25["active_hour_streak"] == 2
    assert row25["quiet_hour_streak"] == 0
    assert "cii_ewm_3h" in out.columns


def test_hours_since_last_violation_counts_inactive_hours_correctly():
    violations = [0, 0, 1, 0, 0, 0, 1, 0]
    panel = pd.DataFrame({
        "h3": ["cell_a"] * 8,
        "timestamp": pd.date_range("2024-01-01 00:00:00", periods=8, freq="1h", tz="UTC"),
        "current_cii": [0.0, 0.0, 5.0, 0.0, 0.0, 0.0, 7.0, 0.0],
        "current_violation_count": violations,
    })
    cfg = {"forecast": {"horizon_hours": 1, "lag_hours": [1], "rolling_windows_hours": [3]}}
    out = add_temporal_features(panel, cfg)
    expected_hours = [0.0, 1.0, 0.0, 1.0, 2.0, 3.0, 0.0, 1.0]
    assert out["hours_since_last_violation"].tolist() == expected_hours


def test_build_hourly_panel_area_without_h3_defaults_numeric_metadata():
    df = pd.DataFrame([
        {
            "h3": "cell_a",
            "created_datetime": pd.Timestamp("2024-01-01 09:10:00", tz="UTC"),
            "weighted_impact": 2.0,
            "lanes": 1,
            "validation_weight": 1.0,
        },
    ])
    area = pd.DataFrame([{"record_count": 10, "support_score": 0.5}])

    panel = build_hourly_panel(df, area, {"forecast": {"bucket_freq": "1h"}})

    row = panel.iloc[0]
    assert row["record_count"] == 0.0
    assert row["support_score"] == 0.0
    assert row["data_quality_score"] == 0.0
    assert row["approved_rate"] == 0.0
    assert row["rejected_rate"] == 0.0


def test_build_hourly_panel_max_panel_rows_guard_raises_clear_error():
    df = pd.DataFrame([
        {
            "h3": "cell_a",
            "created_datetime": pd.Timestamp("2024-01-01 09:10:00", tz="UTC"),
            "weighted_impact": 1.0,
            "lanes": 1,
            "validation_weight": 1.0,
        },
        {
            "h3": "cell_b",
            "created_datetime": pd.Timestamp("2024-01-01 10:20:00", tz="UTC"),
            "weighted_impact": 1.0,
            "lanes": 1,
            "validation_weight": 1.0,
        },
    ])

    try:
        build_hourly_panel(df, pd.DataFrame(), {"forecast": {"bucket_freq": "1h", "max_panel_rows": 3}})
    except ValueError as exc:
        message = str(exc)
    else:
        raise AssertionError("Expected ValueError for oversized panel")

    assert "cell count 2" in message
    assert "timestamp count 2" in message
    assert "estimated rows 4" in message
    assert "max_panel_rows 3" in message


def test_build_hourly_panel_adds_calendar_columns():
    df = pd.DataFrame([
        {
            "h3": "cell_a",
            "created_datetime": pd.Timestamp("2024-01-06 09:10:00", tz="UTC"),
            "weighted_impact": 1.0,
            "lanes": 1,
            "validation_weight": 1.0,
        },
    ])

    panel = build_hourly_panel(df, pd.DataFrame(), {"forecast": {"bucket_freq": "1h"}})

    row = panel.iloc[0]
    assert row["hour"] == 9
    assert row["dow"] == 5
    assert row["month"] == 1
    assert row["is_weekend"] == 1


def test_add_temporal_features_creates_next_3h_target_without_current_hour_leakage():
    panel = pd.DataFrame({
        "h3": ["cell_a"] * 6,
        "timestamp": pd.date_range("2024-01-01 00:00:00", periods=6, freq="1h", tz="UTC"),
        "current_cii": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
        "current_violation_count": [1, 2, 3, 4, 5, 6],
        "hour": [0, 1, 2, 3, 4, 5],
        "dow": [0] * 6,
        "month": [1] * 6,
        "is_weekend": [0] * 6,
    })
    cfg = {"forecast": {"horizon_hours": 3, "lag_hours": [1, 3], "rolling_windows_hours": [3]}}

    out = add_temporal_features(panel, cfg)

    row0 = out.iloc[0]
    assert row0["target_next_3h_cii"] == 2.0 + 3.0 + 4.0
    assert row0["cii_lag_1h"] == 0.0
    row3 = out.iloc[3]
    assert row3["cii_lag_1h"] == 3.0
    assert row3["cii_lag_3h"] == 1.0
    assert row3["cii_roll_3h_mean"] == 2.0


def test_add_temporal_features_does_not_roll_across_cells():
    panel = pd.DataFrame({
        "h3": ["cell_a", "cell_a", "cell_b", "cell_b"],
        "timestamp": [
            pd.Timestamp("2024-01-01 00:00:00", tz="UTC"),
            pd.Timestamp("2024-01-01 01:00:00", tz="UTC"),
            pd.Timestamp("2024-01-01 00:00:00", tz="UTC"),
            pd.Timestamp("2024-01-01 01:00:00", tz="UTC"),
        ],
        "current_cii": [100.0, 200.0, 1.0, 2.0],
        "current_violation_count": [10, 20, 1, 2],
    })
    cfg = {"forecast": {"horizon_hours": 3, "lag_hours": [1], "rolling_windows_hours": [2]}}

    out = add_temporal_features(panel, cfg)
    first_b = out[(out["h3"] == "cell_b") & (out["timestamp"].dt.hour == 0)].iloc[0]
    second_b = out[(out["h3"] == "cell_b") & (out["timestamp"].dt.hour == 1)].iloc[0]

    assert first_b["cii_lag_1h"] == 0.0
    assert first_b["cii_roll_2h_mean"] == 0.0
    assert second_b["cii_lag_1h"] == 1.0
    assert second_b["cii_roll_2h_mean"] == 1.0


def test_add_spatial_ring_features_uses_neighbor_values_at_same_timestamp():
    center = h3.latlng_to_cell(12.9255567, 77.618665, 9)
    neighbor = next(cell for cell in h3.grid_disk(center, 1) if cell != center)
    timestamp = pd.Timestamp("2024-01-01 09:00:00", tz="UTC")
    panel = pd.DataFrame([
        {"h3": center, "timestamp": timestamp, "current_cii": 10.0, "cii_roll_3h_mean": 5.0},
        {"h3": neighbor, "timestamp": timestamp, "current_cii": 40.0, "cii_roll_3h_mean": 20.0},
    ])
    cfg = {"forecast": {"ring_radii": [1]}}

    out = add_spatial_ring_features(panel, cfg)
    row = out[out["h3"] == center].iloc[0]

    assert row["ring1_current_cii_mean"] == 40.0
    assert row["ring1_roll_3h_cii_mean"] == 20.0


def test_add_spatial_ring_features_does_not_use_other_timestamps():
    center = h3.latlng_to_cell(12.9255567, 77.618665, 9)
    neighbor = next(cell for cell in h3.grid_disk(center, 1) if cell != center)
    t0 = pd.Timestamp("2024-01-01 09:00:00", tz="UTC")
    t1 = pd.Timestamp("2024-01-01 10:00:00", tz="UTC")
    panel = pd.DataFrame([
        {"h3": center, "timestamp": t0, "current_cii": 10.0, "cii_roll_3h_mean": 5.0},
        {"h3": neighbor, "timestamp": t1, "current_cii": 40.0, "cii_roll_3h_mean": 20.0},
    ])

    out = add_spatial_ring_features(panel, {"forecast": {"ring_radii": [1]}})
    row = out[(out["h3"] == center) & (out["timestamp"] == t0)].iloc[0]

    assert row["ring1_current_cii_mean"] == 0.0
    assert row["ring1_roll_3h_cii_mean"] == 0.0
    assert row["ring1_active_neighbor_count"] == 0.0


def test_build_hourly_panel_adds_hourly_cii_components():
    df = pd.DataFrame([
        {
            "h3": "cell_a",
            "created_datetime": pd.Timestamp("2024-01-01 09:10:00", tz="UTC"),
            "weighted_impact": 10.0,
            "lanes": 1,
            "validation_weight": 1.0,
        }
    ])
    area = pd.DataFrame([{"h3": "cell_a", "record_count": 1, "support_score": 0.5}])
    cfg = {
        "forecast": {"bucket_freq": "1h"},
        "cii": {
            "rush_hour_weights": {"morning_peak": {"start": 8, "end": 11, "weight": 2.0}, "default": 1.0},
            "capacity_model": "bpr",
            "bpr_alpha": 0.15,
            "bpr_beta": 4,
            "lane_capacity_proxy": 10,
            "bpr_ratio_cap": 3.0,
        },
    }
    panel = build_hourly_panel(df, area, cfg)
    row = panel.iloc[0]
    assert row["current_base_impact"] == 10.0
    assert row["current_capacity_ratio"] == 1.0
    assert row["current_capacity_component"] == 1.15
    assert row["current_temporal_component"] == 2.0
    assert row["current_cii"] == pytest.approx(23.0, abs=0.1)
