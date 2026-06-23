from src import config


def test_load_returns_expected_defaults():
    cfg = config.load()
    assert cfg["geo"]["h3_resolution"] == 9
    assert cfg["geo"]["bbox"]["north"] == 13.2
    assert cfg["pcu"]["CAR"] == 1.0
    assert cfg["severity"]["_default"] == 1.0


def test_config_has_mappls_section():
    cfg = config.load()
    assert cfg["mappls"]["enabled"] is False
    assert cfg["mappls"]["token_url"].startswith("https://")
    assert cfg["mappls"]["poi_keywords"] == []


def test_config_has_cii_section():
    cfg = config.load()
    assert "cii" in cfg
    assert cfg["cii"]["rush_hour_weights"]["morning_peak"]["weight"] == 2.0
    assert cfg["cii"]["recurrence_bonus"]["multiplier"] == 1.5
    assert cfg["cii"]["capacity_weight_power"] == 0.5


def test_config_has_phase3_sections():
    from src import config
    cfg = config.load()
    assert "forecast" in cfg
    assert cfg["forecast"]["train_end_date"] == "2024-03-31"
    assert not any(feature.startswith("poi_") for feature in cfg["forecast"]["features"])
    assert "optimize" in cfg
    assert cfg["optimize"]["officer_budget"] == 100
    assert cfg["optimize"]["decay_factor"] == 0.8


def test_config_has_next3h_forecast_contract():
    cfg = config.load()
    forecast = cfg["forecast"]
    expected_features = [
        "hour",
        "dow",
        "is_weekend",
        "month",
        "lanes",
        "record_count",
        "support_score",
        "data_quality_score",
        "approved_rate",
        "rejected_rate",
        "current_cii",
        "current_violation_count",
        "capacity_ratio",
        "confidence_score",
        "cii_lag_1h",
        "cii_lag_2h",
        "cii_lag_3h",
        "cii_lag_6h",
        "cii_lag_12h",
        "cii_lag_24h",
        "cii_lag_48h",
        "cii_lag_72h",
        "cii_roll_3h_mean",
        "cii_roll_6h_mean",
        "cii_roll_12h_mean",
        "cii_roll_24h_mean",
        "cii_roll_72h_mean",
        "violations_lag_1h",
        "violations_lag_3h",
        "violations_lag_24h",
        "ring1_current_cii_mean",
        "ring1_roll_3h_cii_mean",
        "ring2_current_cii_mean",
        "ring2_roll_3h_cii_mean",
        "current_capacity_ratio",
        "current_capacity_component",
        "current_temporal_component",
        "cii_same_hour_1d",
        "cii_same_hour_7d",
        "cii_ewm_3h",
        "cii_ewm_12h",
        "cii_ewm_24h",
        "hours_since_last_violation",
        "active_hour_streak",
        "quiet_hour_streak",
        "location_count_log",
        "station_count_log",
        "junction_count_log",
        "cell_total_rank_pct",
        "ring1_active_neighbor_count",
        "ring2_active_neighbor_count",
        "capacity_stolen_pct",
        "time_to_criticality_mins",
    ]

    assert forecast["train_end_date"] == "2024-03-31"
    assert forecast["validation_start_date"] == "2024-04-01"
    assert forecast["horizon_hours"] == 3
    assert forecast["bucket_freq"] == "1h"
    assert forecast["lag_hours"] == [1, 2, 3, 6, 12, 24, 48, 72]
    assert forecast["rolling_windows_hours"] == [3, 6, 12, 24, 72]
    assert forecast["ring_radii"] == [1, 2]
    assert forecast["target_column"] == "target_next_3h_cii"
    assert forecast["prediction_column"] == "pred_next_3h_cii"
    assert forecast["min_training_rows"] == 1000
    assert forecast["max_training_rows"] == 1000000
    assert forecast["model"] == {
        "objective": "regression",
        "n_estimators": 160,
        "learning_rate": 0.05,
        "num_leaves": 31,
        "subsample": 0.9,
        "colsample_bytree": 0.9,
        "random_state": 42,
        "n_jobs": 1,
        "force_col_wise": True,
    }
    assert forecast["features"] == expected_features


def test_config_has_winning_model_upgrade_contract():
    cfg = config.load()
    forecast = cfg["forecast"]
    assert forecast["prepare_only_default"] is True
    assert forecast["same_hour_lags_days"] == [1, 7]
    assert forecast["ewm_halflife_hours"] == [3, 12, 24]
    assert forecast["negative_sampling_ratio"] == 4
    assert forecast["high_target_weight"] == 5.0
    assert forecast["deployment_score_column"] == "deployment_score"
    assert forecast["blend"] == {"regression": 0.65, "rank": 0.35}
    assert forecast["ranker"]["enabled"] is True
    assert forecast["ranker"]["objective"] == "rank_xendcg"
