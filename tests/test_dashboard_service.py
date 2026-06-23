import math

import pandas as pd

from app.dashboard_service import (
    build_deployment_payload,
    build_evidence_payload,
    build_filter_options,
    build_hotspot_detail,
    build_hotspot_rows,
    build_intelligence_payload,
    build_map_rows,
    build_mission_payload,
    build_overview_payload,
    build_search_suggestions,
    build_timeline_payload,
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
    assert filters["suggestions"][0]["label"] == "Alpha Road"
    assert filters["suggestions"][0]["type"] == "location"
    assert filters["support"]["min"] == 0.25
    assert filters["support"]["max"] == 0.75


def test_build_search_suggestions_prefers_unique_locations_with_context():
    artifacts = _sample_artifacts()
    artifacts["deployment"] = pd.concat([
        artifacts["deployment"],
        pd.DataFrame([{
            "h3": "cell-c",
            "top_location": "Alpha Road",
            "top_junction": "Junction C",
            "top_police_station": "Station 3",
            "deployment_score": 0.1,
        }]),
    ], ignore_index=True)

    suggestions = build_search_suggestions(artifacts["deployment"])

    assert [item["label"] for item in suggestions] == ["Alpha Road", "Beta Road"]
    assert suggestions[0]["value"] == "Alpha Road"
    assert suggestions[0]["secondary"] == "Station 1 · Junction A"


def test_build_overview_payload_returns_summary_and_filters():
    payload = build_overview_payload(_sample_artifacts(), [{"artifact": "cell_cii.parquet", "exists": True}])

    assert payload["summary"]["officers_deployed"] == 3
    assert payload["summary"]["active_cells"] == 2
    assert payload["highlights"]["lift_pct"] == 125.0
    assert payload["filters"]["stations"] == ["Station 1", "Station 2"]
    assert payload["filters"]["suggestions"][1]["label"] == "Beta Road"
    assert payload["artifacts"][0]["artifact"] == "cell_cii.parquet"


def test_build_search_suggestions_can_use_raw_csv_locations_and_compute_h3():
    raw = pd.DataFrame([
        {
            "location": "Ashok Nagar Main Road, Bengaluru",
            "police_station": "Ashok Nagar",
            "junction_name": "MG Junction",
            "latitude": 12.9701,
            "longitude": 77.6101,
        },
        {
            "location": "Ashok Nagar Main Road, Bengaluru",
            "police_station": "Ashok Nagar",
            "junction_name": "MG Junction",
            "latitude": 12.9701,
            "longitude": 77.6101,
        },
        {
            "location": "Beta Road",
            "police_station": "Station 2",
            "junction_name": "No Junction",
            "latitude": 12.9,
            "longitude": 77.7,
        },
    ])

    suggestions = build_search_suggestions(_sample_artifacts()["deployment"], raw_locations=raw, h3_resolution=9)

    assert [item["label"] for item in suggestions] == ["Ashok Nagar Main Road, Bengaluru", "Beta Road"]
    assert suggestions[0]["station"] == "Ashok Nagar"
    assert suggestions[0]["junction"] == "MG Junction"
    assert suggestions[0]["h3"]


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


def test_build_rows_support_exact_h3_filter_for_selected_search_suggestion():
    artifacts = _sample_artifacts()

    hotspot_rows = build_hotspot_rows(artifacts, h3="cell-b")
    map_rows = build_map_rows(artifacts, h3="cell-b")

    assert len(hotspot_rows) == 1
    assert hotspot_rows[0]["h3"] == "cell-b"
    assert len(map_rows) == 1
    assert map_rows[0]["h3"] == "cell-b"


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


def test_intelligence_and_missions_use_forecast_context_for_matching_h3():
    artifacts = _sample_artifacts()
    artifacts["deployment"].loc[0, ["current_cii", "current_violation_count"]] = [0.0, 0]
    artifacts["predictions"] = pd.DataFrame([
        {
            "h3": "cell-a",
            "timestamp": pd.Timestamp("2024-04-01T09:00:00Z"),
            "current_cii": 15.0,
            "current_violation_count": 33,
            "pred_next_3h_cii": 90.0,
            "capacity_ratio": 0.5,
            "lanes": 2,
            "active_hour_streak": 4,
            "current_chronic_component": 1.5,
            "support_score": 0.75,
        },
    ])

    intelligence = build_intelligence_payload(artifacts, limit=2)["rows"]
    missions = build_mission_payload(artifacts, limit=2)["rows"]

    intel_cell = next(row for row in intelligence if row["h3"] == "cell-a")
    mission_cell = next(row for row in missions if row["id"] == "cell-a")
    assert intel_cell["current_violation_count"] == 33
    assert intel_cell["capacity_theft"]["capacity_theft_pct"] == 50.0
    assert mission_cell["violation_count"] == 33
    assert mission_cell["capacity_theft"]["capacity_theft_pct"] == 50.0


def test_mission_criticality_uses_one_hour_proxy_when_only_3h_forecast_exists():
    artifacts = _sample_artifacts()
    artifacts["deployment"].loc[0, ["current_cii", "current_violation_count", "pred_next_3h_cii"]] = [0.0, 0, 90.0]

    mission = build_mission_payload(artifacts, station="Station 1", limit=1)["rows"][0]

    assert mission["criticality"]["time_to_criticality_minutes"] == 60
    assert mission["criticality"]["criticality_label"] == "critical in 60 min"


def test_timeline_payload_exposes_horizon_source_and_context_fields():
    artifacts = _sample_artifacts()
    artifacts["predictions"] = pd.DataFrame([
        {
            "h3": "cell-a",
            "current_cii": 0.0,
            "current_violation_count": 0,
            "pred_next_3h_cii": 90.0,
            "capacity_ratio": 0.25,
            "lanes": 2,
            "support_score": 0.75,
        },
    ])

    payload = build_timeline_payload(artifacts, limit=1)
    row = payload["rows"][0]

    assert payload["horizon_source"] == "proxy_from_next_3h"
    assert row["pred_next_1h_cii_proxy"] == 30.0
    assert row["capacity_theft"]["capacity_theft_pct"] == 25.0
    assert row["criticality"]["time_to_criticality_minutes"] == 60
