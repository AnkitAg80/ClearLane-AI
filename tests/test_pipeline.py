import os
import pandas as pd
from src.pipeline import run, _apply_road_lanes_to_panel


def test_pipeline_writes_artifacts(tmp_path, sample_csv):
    cfg = {
        "data": {
            "violations_csv": sample_csv,
            "processed_dir": str(tmp_path / "processed"),
            "cache_dir": str(tmp_path / "cache"),
        },
        "geo": {"h3_resolution": 9,
                "bbox": {"north": 13.2, "south": 12.7, "east": 77.8, "west": 77.3}},
        "pcu": {"_default": 1.0},
        "severity": {"_default": 1.0},
        "cii": {
            "rush_hour_weights": {"default": 1.0},
            "recurrence_bonus": {"threshold_days": 5, "multiplier": 1.5},
            "capacity_weight_power": 0.5
        }
    }
    result = run(cfg, with_roadctx=False)

    assert result["cell_time_counts"]["count"].sum() == 5
    out = cfg["data"]["processed_dir"]
    for name in ["cell_time_counts", "cell_totals", "station_totals", "cell_area_summary"]:
        path = os.path.join(out, f"{name}.parquet")
        assert os.path.exists(path)
        assert len(pd.read_parquet(path)) > 0
    area = pd.read_parquet(os.path.join(out, "cell_area_summary.parquet"))
    assert "top_location" in area.columns
    assert "top_locations" in area.columns
    assert "data_quality_score" in area.columns
    assert "support_score" in area.columns
    assert area["support_score"].between(0.0, 1.0).all()
    assert area["unique_location_count"].max() >= 1


def test_apply_road_lanes_to_panel_maps_without_merge_suffix_columns():
    panel = pd.DataFrame({
        "h3": ["cell_a", "cell_b", "cell_c"],
        "lanes": [pd.NA, 2, pd.NA],
        "current_cii": [1.0, 2.0, 3.0],
    })
    road_df = pd.DataFrame({
        "h3": ["cell_a", "cell_c", "cell_c"],
        "lanes": [3, 4, 5],
    })

    out = _apply_road_lanes_to_panel(panel, road_df)

    assert len(out) == len(panel)
    assert "lanes_road" not in out.columns
    assert out["lanes"].tolist() == [3, 2, 4]


def test_pipeline_ignores_mappls_flag_for_active_artifacts(tmp_path, sample_csv, monkeypatch):
    import src.pipeline as pipeline
    cfg = {
        "data": {"violations_csv": sample_csv,
                 "processed_dir": str(tmp_path / "processed"),
                 "cache_dir": str(tmp_path / "cache")},
        "geo": {"h3_resolution": 9,
                "bbox": {"north": 13.2, "south": 12.7, "east": 77.8, "west": 77.3}},
        "pcu": {"_default": 1.0},
        "severity": {"_default": 1.0},
        "cii": {
            "rush_hour_weights": {"default": 1.0},
            "recurrence_bonus": {"threshold_days": 5, "multiplier": 1.5},
            "capacity_weight_power": 0.5
        },
        "roadctx": {
            "network_type": "drive",
            "lanes_default_by_class": {"_default": 1}
        },
        "mappls": {"enabled": True, "cache_dir": str(tmp_path / "mcache"),
                   "nearby_url": "https://atlas.test/nearby",
                   "snap_url": "https://atlas.test/snap",
                   "poi_keywords": ["shopping mall"], "poi_radius_m": 500},
    }

    pipeline.run(cfg, with_roadctx=False, with_mappls=True)
    p = os.path.join(cfg["data"]["processed_dir"], "cell_poi_context.parquet")
    assert not os.path.exists(p)


def test_pipeline_writes_cii_artifact(tmp_path, sample_csv):
    import os
    import pandas as pd
    from src.pipeline import run
    
    cfg = {
        "data": {
            "violations_csv": sample_csv,
            "processed_dir": str(tmp_path / "processed"),
            "cache_dir": str(tmp_path / "cache"),
        },
        "geo": {"h3_resolution": 9,
                "bbox": {"north": 13.2, "south": 12.7, "east": 77.8, "west": 77.3}},
        "pcu": {"CAR": 1.0, "SCOOTER": 0.3, "_default": 1.0},
        "severity": {"WRONG PARKING": 1.0, "NO PARKING": 1.0, "_default": 1.0},
        "roadctx": {
            "network_type": "drive",
            "lanes_default_by_class": {"_default": 1}
        },
        "cii": {
            "rush_hour_weights": {"default": 1.0},
            "recurrence_bonus": {"threshold_days": 5, "multiplier": 1.5},
            "capacity_weight_power": 0.5
        },
        "mappls": {"enabled": False, "cache_dir": str(tmp_path / "mcache")}
    }
    
    result = run(cfg, with_roadctx=False)
    
    out_path = os.path.join(cfg["data"]["processed_dir"], "cell_cii.parquet")
    assert os.path.exists(out_path)
    df = pd.read_parquet(out_path)
    assert "cii" in df.columns
    assert "top_location" in df.columns
    assert "unique_location_count" in df.columns
    assert "support_score" in df.columns
    assert df["support_score"].between(0.0, 1.0).all()
    assert "base_impact" in df.columns
    assert "capacity_component" in df.columns
    assert "confidence_score" in df.columns
    assert len(df) > 0


def test_pipeline_writes_phase3_artifacts(tmp_path, sample_csv):
    import os, json
    import pandas as pd
    import src.pipeline as pipeline
    cfg = {
        "data": {
            "violations_csv": sample_csv,
            "processed_dir": str(tmp_path / "processed"),
            "cache_dir": str(tmp_path / "cache"),
        },
        "geo": {"h3_resolution": 9, "bbox": {"north": 13.2, "south": 12.7, "east": 77.8, "west": 77.3}},
        "pcu": {"CAR": 1.0, "SCOOTER": 0.3, "_default": 1.0},
        "severity": {"_default": 1.0},
        "roadctx": {"network_type": "drive", "lanes_default_by_class": {"_default": 1}},
        "cii": {"rush_hour_weights": {"default": 1.0}, "recurrence_bonus": {"threshold_days": 5, "multiplier": 1.5}, "capacity_weight_power": 0.5},
        "mappls": {"enabled": True, "cache_dir": str(tmp_path / "mcache"), "nearby_url": "https://test", "snap_url": "https://test", "poi_keywords": ["shopping mall"], "poi_radius_m": 500},
        "forecast": {
            "train_end_date": "2024-01-02",
            "bucket_freq": "1h",
            "horizon_hours": 3,
            "target_column": "target_next_3h_cii",
            "prediction_column": "pred_next_3h_cii",
            "lag_hours": [1, 3],
            "rolling_windows_hours": [3],
            "ring_radii": [1],
            "min_training_rows": 1,
            "max_training_rows": 1000,
            "model": {"n_estimators": 10, "learning_rate": 0.1, "num_leaves": 7, "random_state": 42, "n_jobs": 1},
            "features": ["hour", "dow", "is_weekend", "lanes", "current_cii", "cii_lag_1h", "cii_lag_3h", "cii_roll_3h_mean", "ring1_current_cii_mean"],
        },
        "optimize": {"officer_budget": 5, "effectiveness_base": 0.3, "decay_factor": 0.8}
    }
    
    pipeline.run(cfg, with_roadctx=False, with_mappls=True, run_phase3=True)
    
    out = cfg["data"]["processed_dir"]
    assert os.path.exists(os.path.join(out, "deployment_plan.parquet"))
    assert os.path.exists(os.path.join(out, "reactive_deployment_plan.parquet"))
    assert os.path.exists(os.path.join(out, "forecast_training_panel.parquet"))
    assert os.path.exists(os.path.join(out, "forecast_predictions.parquet"))
    assert os.path.exists(os.path.join(out, "forecast_lgbm.joblib"))
    assert os.path.exists(os.path.join(out, "forecast_feature_importance.csv"))
    assert os.path.exists(os.path.join(out, "forecast_model_metadata.json"))
    assert os.path.exists(os.path.join(out, "backtest_metrics.json"))
    assert os.path.exists(os.path.join(out, "roi_metrics.json"))
    
    df = pd.read_parquet(os.path.join(out, "deployment_plan.parquet"))
    assert "officers_assigned" in df.columns
    assert "top_location" in df.columns
    assert "support_score" in df.columns
    assert "pred_next_3h_cii" in df.columns
    assert "ring1_current_cii_mean" in df.columns
    assert df["timestamp"].nunique() == 1

    with open(os.path.join(out, "roi_metrics.json"), "r", encoding="utf-8") as f:
        roi = json.load(f)
    assert {"optimized_relief", "reactive_relief", "lift", "lift_pct"}.issubset(roi)
    with open(os.path.join(out, "backtest_metrics.json"), "r", encoding="utf-8") as f:
        metrics = json.load(f)
    assert metrics["target_column"] == "target_next_3h_cii"


def _phase3_cfg(tmp_path, sample_csv):
    return {
        "data": {
            "violations_csv": sample_csv,
            "processed_dir": str(tmp_path / "processed"),
            "cache_dir": str(tmp_path / "cache"),
        },
        "geo": {"h3_resolution": 9, "bbox": {"north": 13.2, "south": 12.7, "east": 77.8, "west": 77.3}},
        "pcu": {"CAR": 1.0, "SCOOTER": 0.3, "_default": 1.0},
        "severity": {"_default": 1.0},
        "roadctx": {"network_type": "drive", "lanes_default_by_class": {"_default": 1}},
        "cii": {
            "rush_hour_weights": {"default": 1.0},
            "recurrence_bonus": {"threshold_days": 5, "multiplier": 1.5},
            "capacity_weight_power": 0.5,
        },
        "mappls": {"enabled": False, "cache_dir": str(tmp_path / "mcache")},
        "forecast": {
            "train_end_date": "2024-01-02",
            "bucket_freq": "1h",
            "horizon_hours": 3,
            "target_column": "target_next_3h_cii",
            "prediction_column": "pred_next_3h_cii",
            "prepare_only_default": True,
            "lag_hours": [1, 3],
            "rolling_windows_hours": [3],
            "same_hour_lags_days": [1],
            "ewm_halflife_hours": [3],
            "ring_radii": [1],
            "min_training_rows": 1,
            "max_training_rows": 1000,
            "high_target_weight": 5.0,
            "deployment_score_column": "deployment_score",
            "blend": {"regression": 0.65, "rank": 0.35},
            "ranker": {"enabled": True, "objective": "rank_xendcg", "relevance_bins": [0.0, 0.5, 2.0, 5.0, 15.0], "n_estimators": 10, "learning_rate": 0.1, "num_leaves": 7, "random_state": 42, "n_jobs": 1, "force_col_wise": True},
            "model": {"n_estimators": 10, "learning_rate": 0.1, "num_leaves": 7, "random_state": 42, "n_jobs": 1},
            "features": ["hour", "dow", "is_weekend", "lanes", "current_cii", "cii_lag_1h", "cii_lag_3h", "cii_roll_3h_mean", "cii_same_hour_1d", "cii_ewm_3h", "hours_since_last_violation", "active_hour_streak", "quiet_hour_streak", "ring1_current_cii_mean"],
        },
        "optimize": {"officer_budget": 5, "effectiveness_base": 0.3, "decay_factor": 0.8},
    }


def test_pipeline_prepare_only_writes_panel_but_not_model(tmp_path, sample_csv):
    import src.pipeline as pipeline

    cfg = _phase3_cfg(tmp_path, sample_csv)
    cfg["forecast"]["prepare_only_default"] = True

    pipeline.run(cfg, with_roadctx=False, run_phase3=True, train_model=False)

    out = cfg["data"]["processed_dir"]
    assert os.path.exists(os.path.join(out, "forecast_training_panel.parquet"))
    assert not os.path.exists(os.path.join(out, "forecast_lgbm.joblib"))


def test_phase3_panel_contains_all_config_features(tmp_path, sample_csv):
    import pandas as pd
    import src.pipeline as pipeline

    cfg = _phase3_cfg(tmp_path, sample_csv)
    cfg["forecast"]["features"] = [
        "hour", "dow", "is_weekend", "lanes", "current_cii",
        "capacity_ratio", "current_capacity_ratio", "current_capacity_component",
        "current_chronic_component", "current_temporal_component",
        "cii_lag_1h", "cii_lag_3h", "cii_roll_3h_mean", "cii_same_hour_1d",
        "cii_ewm_3h", "hours_since_last_violation", "active_hour_streak",
        "quiet_hour_streak", "ring1_current_cii_mean", "ring1_active_neighbor_count",
        "record_count", "support_score", "data_quality_score", "approved_rate",
        "rejected_rate", "location_count", "location_count_log",
        "station_count_log", "junction_count_log", "cell_total_rank_pct",
    ]
    cfg["forecast"]["prepare_only_default"] = True

    pipeline.run(cfg, with_roadctx=False, run_phase3=True, train_model=False)

    out = cfg["data"]["processed_dir"]
    panel = pd.read_parquet(os.path.join(out, "forecast_training_panel.parquet"))
    missing = [f for f in cfg["forecast"]["features"] if f not in panel.columns]
    assert not missing, f"Config features missing from panel: {missing}"


def test_real_config_features_are_all_produced_by_panel(tmp_path, sample_csv):
    import pandas as pd
    import src.pipeline as pipeline
    from src import config as config_module
    import os

    cfg = config_module.load()
    cfg["data"]["violations_csv"] = sample_csv
    cfg["data"]["processed_dir"] = str(tmp_path / "processed")
    cfg["data"]["cache_dir"] = str(tmp_path / "cache")
    cfg["mappls"] = {"enabled": False, "cache_dir": str(tmp_path / "mcache")}
    cfg["forecast"]["train_end_date"] = "2024-01-02"
    cfg["forecast"]["min_training_rows"] = 1
    cfg["forecast"]["max_training_rows"] = 1000
    cfg["forecast"]["model"] = {"n_estimators": 10, "learning_rate": 0.1, "num_leaves": 7, "random_state": 42, "n_jobs": 1}
    cfg["optimize"] = {"officer_budget": 5, "effectiveness_base": 0.3, "decay_factor": 0.8}

    pipeline.run(cfg, with_roadctx=False, run_phase3=True, train_model=False)

    out = cfg["data"]["processed_dir"]
    panel = pd.read_parquet(os.path.join(out, "forecast_training_panel.parquet"))
    features = cfg.get("forecast", {}).get("features", [])
    missing = [f for f in features if f not in panel.columns]
    assert not missing, f"Real config features missing from panel: {missing}"
