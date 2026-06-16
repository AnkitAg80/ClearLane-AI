import pandas as pd

def train_climatology(train_df):
    """Train a naive climatology model: mean CII per (h3, hour, dow)."""
    return train_df.groupby(["h3", "hour", "dow"])["cii"].mean().reset_index(name="pred_cii")

def predict_climatology(model, test_df):
    """Predict CII using the climatology model, filling missing with 0."""
    res = test_df.merge(model, on=["h3", "hour", "dow"], how="left")
    res["pred_cii"] = res["pred_cii"].fillna(0.0)
    return res
