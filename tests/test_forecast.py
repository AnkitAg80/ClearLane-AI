import pandas as pd
from src.forecast import train_climatology, predict_climatology

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
