import pandas as pd
import lightgbm as lgb

def train_climatology(train_df):
    """Train a naive climatology model: mean CII per (h3, hour, dow)."""
    return train_df.groupby(["h3", "hour", "dow"])["cii"].mean().reset_index(name="pred_cii")

def predict_climatology(model, test_df):
    """Predict CII using the climatology model, filling missing with 0."""
    res = test_df.merge(model, on=["h3", "hour", "dow"], how="left")
    res["pred_cii"] = res["pred_cii"].fillna(0.0)
    return res

def train_lgbm(train_df, cfg):
    """Train a LightGBM regressor to predict CII."""
    features = cfg["forecast"]["features"]
    
    df = train_df.copy()
    # Ensure features exist
    for f in features:
        if f not in df.columns:
            df[f] = 0
            
    X = df[features]
    y = df["cii"]
    
    model = lgb.LGBMRegressor(n_estimators=50, random_state=42, n_jobs=1)
    model.fit(X, y)
    return model

def predict_lgbm(model, test_df, cfg):
    """Predict CII using trained LightGBM model."""
    features = cfg["forecast"]["features"]
    
    df = test_df.copy()
    for f in features:
        if f not in df.columns:
            df[f] = 0
            
    df["pred_cii"] = model.predict(df[features])
    df["pred_cii"] = df["pred_cii"].clip(lower=0) # No negative CII
    return df
