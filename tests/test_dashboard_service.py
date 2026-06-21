import math

import pandas as pd

from app.dashboard_service import (
    build_deployment_payload,
    build_evidence_payload,
    build_filter_options,
    build_hotspot_detail,
    build_hotspot_rows,
    build_map_rows,
    build_overview_payload,
)


def _sample_artifacts():
    deployment = pd.DataFrame([
        {
            "h3": "cell-a",
            "top_location": "Alpha Road",
            "top_junction": "Junction A",
            "top_police_station": "Station 1",
            "deployment_score": 0.92,
            "pred_next_3h_cii": 12.5,
            "rank_score": 0.81,
            "expected_relief": 7.5,
            "officers_assigned": 2,
            "forecast_cii": 13.0,
            "current_cii": 4.0,
            "current_violation_count": 9,
            "support_score": 0.75,
            "data_quality_score": 0.66,
            "ring1_current_cii_mean": 3.3,
        },
        {
            "h3": "cell-b",
            "top_location": "Beta Road",
            "top_junction": "Junction B",
            "top_police_station": "Station 2",
            "deployment_score": 0.42,
            "pred_next_3h_cii": 6.5,
            "rank_score": 0.35,
            "expected_relief": 2.0,
            "officers_assigned": 1,
            "forecast_cii": 7.0,
            "current_cii": 2.0,
            "current_violation_count": 4,
            "support_score": 0.25,
            "data_quality_score": 0.4,
            "ring1_current_cii_mean": 1.2,
        },
    ])
    cii = deployment[[
        "h3",
        "top_location",
        "top_junction",
        "top_police_station",
        "current_cii",
        "current_violation_count",
        "support_score",
        "data_quality_score",
    ]].rename(columns={"current_cii": "cii"})
    reactive = pd.DataFrame([
        {"h3": "cell-a", "officers_assigned": 1, "expected_relief": 2.5},
        {"h3": "cell-b", "officers_assigned": 1, "expected_relief": 1.5},
    ])
    return {
        "cii": cii,
        "deployment": deployment,
        "reactive": reactive,
        "predictions": pd.DataFrame(),
        "backtest_metrics": {
            "deployment_score_top25_recall": 0.5,
            "deployment_score_ndcg_at_25": 0.7,
            "mean_top25_recall": 0.4,
            "mean_ndcg_at_25": 0.6,
        },
        "roi_metrics": {
            "lift_pct": 125.0,
            "optimized_relief": 9.5,
            "reactive_relief": 4.0,
        },
        "model_metadata": {
            "target_column": "target_next_3h_cii",
            "prediction_column": "pred_next_3h_cii",
            "ranker_enabled": True,
            "features": ["hour", "dow", "ring1_current_cii_mean"],
        },
        "feature_importance": pd.DataFrame([
            {"feature": "hour", "importance": 10},
            {"feature": "dow", "importance": 5},
        ]),
        "ranker_importance": pd.DataFrame([
            {"feature": "ring1_current_cii_mean", "importance": 4},
        ]),
    }


def test_build_filter_options_returns_stations_and_support_bounds():
    filters = build_filter_options(_sample_artifacts()["deployment"])

    assert filters["stations"] == ["Station 1", "Station 2"]
    assert filters["support"]["min"] == 0.25
    assert filters["support"]["max"] == 0.75


def test_build_overview_payload_returns_summary_and_filters():
    payload = build_overview_payload(_sample_artifacts(), [{"artifact": "cell_cii.parquet", "exists": True}])

    assert payload["summary"]["officers_deployed"] == 3
    assert payload["summary"]["active_cells"] == 2
    assert payload["highlights"]["lift_pct"] == 125.0
    assert payload["filters"]["stations"] == ["Station 1", "Station 2"]
    assert payload["artifacts"][0]["artifact"] == "cell_cii.parquet"


def test_build_hotspot_rows_filters_search_station_and_support():
    artifacts = _sample_artifacts()

    rows = build_hotspot_rows(artifacts, station="Station 1", min_support=0.5, query="alpha")

    assert len(rows) == 1
    assert rows[0]["h3"] == "cell-a"
    assert rows[0]["label"] == "Alpha Road"
    assert rows[0]["deployment_score"] == 0.92
    assert not any(isinstance(value, float) and math.isnan(value) for value in rows[0].values())


def test_build_map_rows_includes_ui_ready_metric_fields():
    rows = build_map_rows(_sample_artifacts(), station="Station 2", min_support=0.2)

    assert len(rows) == 1
    assert rows[0]["h3"] == "cell-b"
    assert rows[0]["map_label"] == "Beta Road"
    assert rows[0]["metric_values"]["deployment_score"] == 0.42
    assert rows[0]["metric_values"]["officers_assigned"] == 1
    assert rows[0]["metric_values"]["remaining_next_3h_cii"] == 4.5


def test_build_map_rows_clips_remaining_cii_after_large_relief():
    artifacts = _sample_artifacts()
    artifacts["deployment"].loc[0, "expected_relief"] = 50.0

    rows = build_map_rows(artifacts, station="Station 1", min_support=0.2)

    assert rows[0]["metric_values"]["remaining_next_3h_cii"] == 0.0


def test_build_map_rows_deduplicates_h3_cells_and_keeps_strongest_cell_signal():
    artifacts = _sample_artifacts()
    artifacts["cii"] = pd.concat([
        artifacts["cii"],
        pd.DataFrame([{
            "h3": "cell-a",
            "top_location": "Alpha Road",
            "top_junction": "Junction A",
            "top_police_station": "Station 1",
            "cii": 11.0,
            "current_violation_count": 18,
            "support_score": 0.75,
            "data_quality_score": 0.66,
        }]),
    ], ignore_index=True)

    rows = build_map_rows(artifacts, limit=10)

    assert len(rows) == 2
    assert len({row["h3"] for row in rows}) == 2
    alpha = next(row for row in rows if row["h3"] == "cell-a")
    assert alpha["metric_values"]["cii"] == 11.0


def test_build_map_rows_applies_query_and_limit_for_browser_payload():
    rows = build_map_rows(_sample_artifacts(), query="road", limit=1)

    assert len(rows) == 1
    assert rows[0]["h3"] == "cell-a"


def test_build_hotspot_detail_returns_signals_and_components():
    detail = build_hotspot_detail(_sample_artifacts(), "cell-a")

    assert detail["h3"] == "cell-a"
    assert detail["title"] == "Alpha Road"
    assert detail["scorecards"]["officers_assigned"] == 2
    assert {"name": "ring1_current_cii_mean", "value": 3.3} in detail["signals"]


def test_build_deployment_payload_compares_optimized_and_reactive():
    payload = build_deployment_payload(_sample_artifacts())

    assert payload["totals"]["optimized_relief"] == 9.5
    assert payload["totals"]["reactive_relief"] == 4.0
    assert payload["totals"]["lift_pct"] == 125.0
    assert payload["optimized"][0]["h3"] == "cell-a"


def test_build_evidence_payload_returns_metrics_and_feature_tables():
    payload = build_evidence_payload(_sample_artifacts(), [{"artifact": "x", "exists": False}])

    assert payload["model"]["ranker_enabled"] is True
    assert payload["backtest"]["deployment_score_top25_recall"] == 0.5
    assert payload["feature_importance"]["regression"][0]["feature"] == "hour"
    assert payload["artifacts"][0]["exists"] is False
