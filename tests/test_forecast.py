import pandas as pd
from src.forecast import train_climatology, predict_climatology, train_lgbm, predict_lgbm

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

def test_lgbm_missing_features():
    train_df = pd.DataFrame({
        "h3": ["c1", "c2"],
        "hour": [9, 10],
        "dow": [0, 1],
        "lanes": [2, 4],
        "cii": [15.0, 5.0]
    })
    cfg = {"forecast": {"features": ["hour", "dow", "lanes", "poi_shopping_mall", "poi_metro_station"]}}
    
    model = train_lgbm(train_df, cfg)
    assert "poi_shopping_mall" not in train_df.columns
    
    test_df = pd.DataFrame({
        "h3": ["c1"], "hour": [9], "dow": [0]
    })
    
    preds = predict_lgbm(model, test_df, cfg)
    assert "pred_cii" in preds.columns
    assert "lanes" not in test_df.columns
