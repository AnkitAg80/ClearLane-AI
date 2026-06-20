import pandas as pd
import h3
import json
import os
import joblib

from src.forecast import (
    add_ring_features,
    predict_climatology,
    predict_lgbm,
    save_model_artifacts,
    train_climatology,
    train_lgbm,
)

from src.forecast import add_training_weights


def test_add_training_weights_boosts_high_targets():
    df = pd.DataFrame({"target_next_3h_cii": [0.0, 1.0, 10.0]})
    cfg = {"forecast": {"target_column": "target_next_3h_cii", "high_target_weight": 5.0}}
    out = add_training_weights(df, cfg)
    assert "training_weight" in out.columns
    assert out.loc[2, "training_weight"] > out.loc[1, "training_weight"] > out.loc[0, "training_weight"]


from src.forecast import add_deployment_score, make_ranking_relevance, predict_ranker, train_ranker


def test_make_ranking_relevance_bins_target_values():
    df = pd.DataFrame({"target_next_3h_cii": [0.0, 0.2, 1.0, 3.0, 8.0, 20.0]})
    cfg = {
        "forecast": {
            "target_column": "target_next_3h_cii",
            "ranker": {"relevance_bins": [0.0, 0.5, 2.0, 5.0, 15.0]},
        }
    }
    rel = make_ranking_relevance(df, cfg)
    assert rel.tolist() == [0, 0, 1, 2, 3, 4]


def test_train_ranker_predicts_rank_score_per_timestamp():
    train_df = pd.DataFrame({
        "timestamp": pd.to_datetime([
            "2024-01-01 00:00:00", "2024-01-01 00:00:00", "2024-01-01 00:00:00",
            "2024-01-01 01:00:00", "2024-01-01 01:00:00", "2024-01-01 01:00:00",
        ]),
        "hour": [0, 0, 0, 1, 1, 1],
        "dow": [0, 0, 0, 0, 0, 0],
        "current_cii": [10.0, 3.0, 0.0, 11.0, 2.0, 0.0],
        "target_next_3h_cii": [20.0, 5.0, 0.0, 22.0, 4.0, 0.0],
    })
    cfg = {
        "forecast": {
            "features": ["hour", "dow", "current_cii"],
            "target_column": "target_next_3h_cii",
            "ranker": {
                "enabled": True,
                "objective": "rank_xendcg",
                "relevance_bins": [0.0, 0.5, 2.0, 5.0, 15.0],
                "n_estimators": 10,
                "learning_rate": 0.1,
                "num_leaves": 7,
                "random_state": 42,
                "n_jobs": 1,
                "force_col_wise": True,
            },
        }
    }
    ranker = train_ranker(train_df, cfg)
    out = predict_ranker(ranker, train_df, cfg)
    assert "rank_score" in out.columns
    assert out["rank_score"].between(0, 1).all()


def test_add_deployment_score_blends_regression_and_rank_columns():
    df = pd.DataFrame({
        "pred_next_3h_cii": [10.0, 20.0],
        "rank_score": [0.9, 0.1],
    })
    cfg = {
        "forecast": {
            "prediction_column": "pred_next_3h_cii",
            "deployment_score_column": "deployment_score",
            "blend": {"regression": 0.65, "rank": 0.35},
        }
    }
    out = add_deployment_score(df, cfg)
    assert "deployment_score" in out.columns
    assert out.loc[1, "deployment_score"] > 0
    assert out["deployment_score"].between(0, 1).all()

def test_climatology_baseline():
    df = pd.DataFrame([
        {"h3": "c1", "hour": 9, "dow": 0, "cii": 10.0},
        {"h3": "c1", "hour": 9, "dow": 0, "cii": 20.0},
        {"h3": "c2", "hour": 10, "dow": 1, "cii": 5.0},
    ])
    
    model = train_climatology(df)
    
    test_df = pd.DataFrame([
        {"h3": "c1", "hour": 9, "dow": 0},
        {"h3": "c2", "hour": 10, "dow": 1},
        {"h3": "c3", "hour": 12, "dow": 2}, # Unseen
    ])
    
    preds = predict_climatology(model, test_df)
    assert preds.loc[0, "pred_cii"] == 15.0  # Mean of 10 and 20
    assert preds.loc[1, "pred_cii"] == 5.0
    assert preds.loc[2, "pred_cii"] == 0.0   # Fallback for unseen

def test_lgbm_forecast():
    # Synthetic data
    train_df = pd.DataFrame({
        "h3": ["c1", "c2", "c1", "c2"],
        "hour": [9, 10, 9, 10],
        "dow": [0, 1, 0, 1],
        "lanes": [2, 4, 2, 4],
        "poi_shopping_mall": [1, 0, 1, 0],
        "poi_metro_station": [0, 1, 0, 1],
        "cii": [15.0, 5.0, 14.0, 6.0]
    })
    
    cfg = {"forecast": {"features": ["hour", "dow", "lanes", "poi_shopping_mall", "poi_metro_station"]}}
    
    model = train_lgbm(train_df, cfg)
    
    test_df = pd.DataFrame({
        "h3": ["c1"], "hour": [9], "dow": [0], "lanes": [2],
        "poi_shopping_mall": [1], "poi_metro_station": [0]
    })
    
    preds = predict_lgbm(model, test_df, cfg)
    assert "pred_cii" in preds.columns
    assert len(preds) == 1

def test_lgbm_missing_features_raises_on_train():
    from src.forecast import _ensure_features
    train_df = pd.DataFrame({
        "h3": ["c1", "c2"],
        "hour": [9, 10],
        "dow": [0, 1],
        "lanes": [2, 4],
        "cii": [15.0, 5.0]
    })
    features = ["hour", "dow", "lanes", "poi_shopping_mall"]
    try:
        _ensure_features(train_df, features, allow_fill=False)
    except ValueError as e:
        assert "poi_shopping_mall" in str(e)
    else:
        raise AssertionError("Expected ValueError for missing features")

    filled = _ensure_features(train_df, features, allow_fill=True)
    assert filled["poi_shopping_mall"].tolist() == [0.0, 0.0]


def test_add_ring_features_uses_neighbor_cells():
    center = h3.latlng_to_cell(12.9255567, 77.618665, 9)
    neighbor = next(cell for cell in h3.grid_disk(center, 1) if cell != center)
    far = h3.latlng_to_cell(12.9054633, 77.7007781, 9)
    df = pd.DataFrame([
        {"h3": center, "hour": 9, "dow": 0, "cii": 10.0, "violation_total": 100},
        {"h3": neighbor, "hour": 9, "dow": 0, "cii": 30.0, "violation_total": 50},
        {"h3": far, "hour": 9, "dow": 0, "cii": 90.0, "violation_total": 200},
    ])
    out = add_ring_features(df, {"forecast": {"ring_radius": 1}})
    center_row = out[out["h3"] == center].iloc[0]
    assert center_row["ring_violation_total_mean"] == 50.0
    assert center_row["ring_cii_mean"] == 30.0


def test_lgbm_next3h_training_saves_model_and_importance(tmp_path):
    train_df = pd.DataFrame({
        "hour": [8, 9, 10, 11, 12, 13],
        "dow": [0, 0, 0, 0, 0, 0],
        "is_weekend": [0, 0, 0, 0, 0, 0],
        "lanes": [1, 1, 2, 2, 1, 1],
        "current_cii": [1, 2, 3, 4, 5, 6],
        "cii_lag_1h": [0, 1, 2, 3, 4, 5],
        "target_next_3h_cii": [9, 12, 15, 10, 6, 0],
    })
    cfg = {
        "forecast": {
            "target_column": "target_next_3h_cii",
            "prediction_column": "pred_next_3h_cii",
            "features": ["hour", "dow", "is_weekend", "lanes", "current_cii", "cii_lag_1h"],
            "model": {"n_estimators": 20, "learning_rate": 0.1, "num_leaves": 7, "random_state": 42, "n_jobs": 1},
        }
    }

    model = train_lgbm(train_df, cfg)
    pred = predict_lgbm(model, train_df, cfg)
    assert "pred_next_3h_cii" in pred.columns
    assert "pred_cii" in pred.columns

    save_model_artifacts(model, cfg, str(tmp_path))

    assert os.path.exists(tmp_path / "forecast_lgbm.joblib")
    assert os.path.exists(tmp_path / "forecast_feature_importance.csv")
    assert os.path.exists(tmp_path / "forecast_model_metadata.json")
    metadata = json.load(open(tmp_path / "forecast_model_metadata.json"))
    assert metadata["target_column"] == "target_next_3h_cii"
    assert joblib.load(tmp_path / "forecast_lgbm.joblib") is not None
