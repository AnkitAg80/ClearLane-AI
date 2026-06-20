import pandas as pd
import os
from src.app_utils import (
    artifact_status,
    available_display_columns,
    cii_component_columns,
    deployment_display_columns,
    format_pct,
    format_hotspot_label,
    format_score,
    get_h3_layer,
    load_csv_safe,
    load_data_safe,
    load_json_safe,
    load_stage4_artifacts,
    prepare_map_dataframe,
    required_stage4_artifacts,
    summarize_deployment,
    validate_stage4_artifacts,
)

def test_load_data_safe(tmp_path):
    df = pd.DataFrame([{"a": 1}])
    p = tmp_path / "test.parquet"
    df.to_parquet(p)
    
    # Load existing
    loaded = load_data_safe(str(p))
    assert len(loaded) == 1
    
    # Load missing
    missing = load_data_safe("non_existent.parquet")
    assert missing is None


def test_available_display_columns_keeps_existing_order():
    df = pd.DataFrame([{"h3": "c1", "top_location": "Main Road"}])
    cols = available_display_columns(df, ["top_location", "top_junction", "h3"])
    assert cols == ["top_location", "h3"]


def test_deployment_display_columns_returns_existing_judge_columns():
    df = pd.DataFrame([{
        "top_location": "Main Road",
        "top_junction": "Junction A",
        "top_police_station": "Station A",
        "officers_assigned": 2,
        "deployment_score": 0.9,
        "pred_next_3h_cii": 11.0,
        "rank_score": 0.8,
        "expected_relief": 3.0,
        "h3": "cell-a",
    }])

    assert deployment_display_columns(df) == [
        "top_location",
        "top_junction",
        "top_police_station",
        "officers_assigned",
        "deployment_score",
        "pred_next_3h_cii",
        "rank_score",
        "expected_relief",
        "h3",
    ]


def test_format_hotspot_label_prefers_location():
    row = {"top_location": "Main Road", "top_junction": "No Junction", "h3": "abc"}
    assert format_hotspot_label(row) == "Main Road"


def test_format_hotspot_label_falls_back_to_junction_then_h3():
    row = {"top_location": "", "top_junction": "BTP123", "h3": "abc"}
    assert format_hotspot_label(row) == "BTP123"


def test_cii_component_columns_only_existing():
    df = pd.DataFrame([{"base_impact": 1, "capacity_component": 2, "missing": 3}])
    assert cii_component_columns(df) == ["base_impact", "capacity_component"]


def test_get_h3_layer_handles_empty_or_missing_color_column():
    empty_layer = get_h3_layer(pd.DataFrame(columns=["h3"]), "deployment_score")
    missing_layer = get_h3_layer(pd.DataFrame([{"h3": "a"}]), "deployment_score")
    nonnumeric_layer = get_h3_layer(
        pd.DataFrame([
            {"h3": "a", "deployment_score": "bad"},
            {"h3": "b", "deployment_score": "2.5"},
            {"h3": "c", "deployment_score": None},
        ]),
        "deployment_score",
    )

    assert "170" in empty_layer.to_json()
    assert "170" in missing_layer.to_json()
    assert [row["deployment_score"] for row in nonnumeric_layer.data] == [0.0, 2.5, 0.0]


def test_prepare_map_dataframe_preserves_cii_rows_and_adds_deployment_context():
    cii = pd.DataFrame([
        {
            "h3": "a",
            "cii": 10.0,
            "top_location": "Alpha",
            "top_junction": "Junction A",
            "top_police_station": "Station A",
        },
        {
            "h3": "b",
            "cii": 5.0,
            "top_location": "Beta",
            "top_junction": "Junction B",
            "top_police_station": "Station B",
        },
    ])
    deployment = pd.DataFrame([
        {
            "h3": "a",
            "deployment_score": 0.9,
            "pred_next_3h_cii": 11.0,
            "officers_assigned": 2,
            "expected_relief": 3.0,
        }
    ])

    result = prepare_map_dataframe(cii, deployment)

    assert result["h3"].tolist() == ["a", "b"]
    row_a = result.loc[result["h3"] == "a"].iloc[0]
    row_b = result.loc[result["h3"] == "b"].iloc[0]
    assert row_a["deployment_score"] == 0.9
    assert row_a["pred_next_3h_cii"] == 11.0
    assert row_a["officers_assigned"] == 2
    assert row_a["expected_relief"] == 3.0
    assert row_a["map_label"] == "Alpha"
    assert row_b["deployment_score"] == 0.0
    assert row_b["officers_assigned"] == 0.0
    assert row_b["pred_next_3h_cii"] == 0.0


def test_prepare_map_dataframe_deduplicates_deployment_rows_deterministically():
    cii = pd.DataFrame([
        {
            "h3": "a",
            "cii": 10.0,
            "top_location": "Alpha",
            "top_junction": "Junction A",
            "top_police_station": "Station A",
        },
        {
            "h3": "b",
            "cii": 5.0,
            "top_location": "Beta",
            "top_junction": "Junction B",
            "top_police_station": "Station B",
        },
    ])
    deployment = pd.DataFrame([
        {
            "h3": "a",
            "deployment_score": 0.7,
            "pred_next_3h_cii": 8.0,
            "officers_assigned": 1,
            "expected_relief": 2.0,
        },
        {
            "h3": "a",
            "deployment_score": 0.6,
            "pred_next_3h_cii": 9.0,
            "officers_assigned": 2,
            "expected_relief": 1.0,
        },
        {
            "h3": "b",
            "deployment_score": 0.8,
            "pred_next_3h_cii": 7.0,
            "officers_assigned": 0,
            "expected_relief": 4.0,
        },
    ])

    result = prepare_map_dataframe(cii, deployment)

    assert len(result) == len(cii)
    row_a = result.loc[result["h3"] == "a"].iloc[0]
    assert row_a["officers_assigned"] == 2
    assert row_a["deployment_score"] == 0.6
    assert row_a["expected_relief"] == 1.0


def test_required_stage4_artifacts_returns_expected_duplicate_free_list():
    names = required_stage4_artifacts()
    assert names == [
        "cell_cii.parquet",
        "forecast_predictions.parquet",
        "deployment_plan.parquet",
        "reactive_deployment_plan.parquet",
        "forecast_feature_importance.csv",
        "forecast_ranker_feature_importance.csv",
        "forecast_model_metadata.json",
        "backtest_metrics.json",
        "roi_metrics.json",
    ]
    assert len(names) == len(set(names))


def test_artifact_status_reports_missing_and_existing_files(tmp_path):
    existing = tmp_path / "cell_cii.parquet"
    existing.write_bytes(b"stub")
    status = artifact_status(str(tmp_path), ["cell_cii.parquet", "missing.parquet"])
    assert bool(status.loc[status["artifact"] == "cell_cii.parquet", "exists"].iloc[0]) is True
    assert bool(status.loc[status["artifact"] == "missing.parquet", "exists"].iloc[0]) is False


def test_validate_stage4_artifacts_returns_missing_names(tmp_path):
    missing = validate_stage4_artifacts(str(tmp_path), ["a.parquet", "b.json"])
    assert missing == ["a.parquet", "b.json"]
    (tmp_path / "a.parquet").write_bytes(b"stub")
    missing = validate_stage4_artifacts(str(tmp_path), ["a.parquet", "b.json"])
    assert missing == ["b.json"]


def test_load_json_safe_returns_dict_or_none(tmp_path):
    path = tmp_path / "metrics.json"
    path.write_text('{"mae": 1.25}', encoding="utf-8")
    assert load_json_safe(str(path)) == {"mae": 1.25}
    assert load_json_safe(str(tmp_path / "missing.json")) is None


def test_load_csv_safe_returns_dataframe_or_none(tmp_path):
    path = tmp_path / "importance.csv"
    path.write_text("feature,importance\nhour,10\n", encoding="utf-8")
    df = load_csv_safe(str(path))
    assert df.iloc[0]["feature"] == "hour"
    assert load_csv_safe(str(tmp_path / "missing.csv")) is None


def test_load_stage4_artifacts_loads_expected_keys(tmp_path):
    pd.DataFrame([{"h3": "cell", "cii": 1.0}]).to_parquet(tmp_path / "cell_cii.parquet")
    pd.DataFrame([{"h3": "cell", "deployment_score": 0.9}]).to_parquet(tmp_path / "deployment_plan.parquet")
    pd.DataFrame([{"h3": "cell", "current_violation_count": 1}]).to_parquet(tmp_path / "reactive_deployment_plan.parquet")
    pd.DataFrame([{"h3": "cell", "pred_next_3h_cii": 2.0}]).to_parquet(tmp_path / "forecast_predictions.parquet")
    (tmp_path / "backtest_metrics.json").write_text('{"top25_recall": 0.5}', encoding="utf-8")
    (tmp_path / "roi_metrics.json").write_text('{"lift_pct": 100.0}', encoding="utf-8")
    (tmp_path / "forecast_model_metadata.json").write_text('{"ranker_enabled": true}', encoding="utf-8")
    (tmp_path / "forecast_feature_importance.csv").write_text("feature,importance\nhour,1\n", encoding="utf-8")
    (tmp_path / "forecast_ranker_feature_importance.csv").write_text("feature,importance\nrank_score,1\n", encoding="utf-8")

    artifacts = load_stage4_artifacts(str(tmp_path))

    assert set(artifacts) == {
        "cii",
        "deployment",
        "reactive",
        "predictions",
        "backtest_metrics",
        "roi_metrics",
        "model_metadata",
        "feature_importance",
        "ranker_importance",
    }
    assert artifacts["deployment"].iloc[0]["deployment_score"] == 0.9
    assert artifacts["backtest_metrics"]["top25_recall"] == 0.5


def test_format_pct_and_score_are_dashboard_ready():
    assert format_pct(0.6666) == "66.7%"
    assert format_pct(0.6666, digits=2) == "66.66%"
    assert format_pct(None) == "N/A"
    assert format_pct(float("nan")) == "N/A"
    assert format_score(12.3456) == "12.346"
    assert format_score(12.3456, digits=2) == "12.35"
    assert format_score(None) == "N/A"
    assert format_score(float("nan")) == "N/A"


def test_summarize_deployment_returns_core_values():
    plan = pd.DataFrame([
        {"officers_assigned": 2, "expected_relief": 10.0, "forecast_cii": 20.0},
        {"officers_assigned": 0, "expected_relief": 0.0, "forecast_cii": 5.0},
        {"officers_assigned": 1, "expected_relief": 4.0, "forecast_cii": 7.0},
    ])
    roi = {"lift_pct": 125.5}
    metrics = {"deployment_score_top25_recall": 0.5, "mean_ndcg_at_25": 0.27}
    summary = summarize_deployment(plan, roi, metrics)
    assert summary["officers_deployed"] == 3
    assert summary["active_cells"] == 2
    assert summary["expected_relief"] == 14.0
    assert summary["forecast_pressure"] == 32.0
    assert summary["lift_pct"] == 125.5
    assert summary["deployment_score_top25_recall"] == 0.5


def test_summarize_deployment_handles_missing_and_null_metrics():
    plan = pd.DataFrame([{"officers_assigned": 1}])
    summary = summarize_deployment(
        plan,
        {"lift_pct": None},
        {"deployment_score_top25_recall": float("nan"), "mean_ndcg_at_25": None},
    )
    assert summary["officers_deployed"] == 1
    assert summary["active_cells"] == 1
    assert summary["expected_relief"] == 0.0
    assert summary["forecast_pressure"] == 0.0
    assert summary["lift_pct"] == 0.0
    assert summary["deployment_score_top25_recall"] is None
    assert summary["mean_ndcg_at_25"] is None
