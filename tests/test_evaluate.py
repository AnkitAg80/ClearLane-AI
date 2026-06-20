import pandas as pd

from src.evaluate import (
    deployment_roi,
    evaluate_forecast,
    ndcg_at_k,
    regression_metrics,
    top_k_overlap,
    top_k_recall,
)


def test_regression_metrics_returns_mae_rmse():
    df = pd.DataFrame({"cii": [10.0, 20.0], "pred_cii": [12.0, 17.0]})
    metrics = regression_metrics(df)
    assert metrics["mae"] == 2.5
    assert round(metrics["rmse"], 3) == 2.55
    assert metrics["rows"] == 2


def test_top_k_overlap_compares_actual_and_predicted_hotspots():
    df = pd.DataFrame({
        "h3": ["a", "b", "c"],
        "cii": [100, 50, 10],
        "pred_cii": [90, 5, 60],
    })
    assert top_k_overlap(df, k=2) == 0.5


def test_deployment_roi_compares_optimized_to_reactive():
    optimized = pd.DataFrame({"expected_relief": [10.0, 5.0]})
    reactive = pd.DataFrame({"expected_relief": [8.0, 4.0]})
    roi = deployment_roi(optimized, reactive)
    assert roi["optimized_relief"] == 15.0
    assert roi["reactive_relief"] == 12.0
    assert roi["lift"] == 3.0


def test_top_k_recall_and_ndcg_reward_correct_hotspot_ordering():
    df = pd.DataFrame({
        "h3": ["a", "b", "c", "d"],
        "target_next_3h_cii": [100.0, 80.0, 10.0, 5.0],
        "pred_next_3h_cii": [90.0, 70.0, 20.0, 1.0],
    })
    assert top_k_recall(df, "target_next_3h_cii", "pred_next_3h_cii", k=2) == 1.0
    assert ndcg_at_k(df, "target_next_3h_cii", "pred_next_3h_cii", k=2) == 1.0


def test_evaluate_forecast_returns_regression_and_ranking_metrics():
    df = pd.DataFrame({
        "h3": ["a", "b", "c"],
        "target_next_3h_cii": [10.0, 20.0, 30.0],
        "pred_next_3h_cii": [12.0, 18.0, 25.0],
    })
    metrics = evaluate_forecast(df, "target_next_3h_cii", "pred_next_3h_cii", k_values=[2])
    assert metrics["rows"] == 3
    assert metrics["mae"] == 3.0
    assert "top2_recall" in metrics
    assert "ndcg_at_2" in metrics


from src.evaluate import evaluate_by_timestamp


def test_evaluate_by_timestamp_averages_topk_metrics():
    df = pd.DataFrame({
        "timestamp": ["t1", "t1", "t2", "t2"],
        "h3": ["a", "b", "a", "b"],
        "target_next_3h_cii": [10.0, 1.0, 1.0, 10.0],
        "pred_next_3h_cii": [9.0, 2.0, 2.0, 9.0],
    })
    metrics = evaluate_by_timestamp(df, "target_next_3h_cii", "pred_next_3h_cii", k=1)
    assert metrics["timestamp_count"] == 2
    assert metrics["mean_top1_recall"] == 1.0
