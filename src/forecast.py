import json
import os

import h3
import joblib
import lightgbm as lgb
import pandas as pd


def _neighbors(cell, radius):
    try:
        return [c for c in h3.grid_disk(cell, radius) if c != cell]
    except Exception:
        return []


def add_ring_features(df, cfg):
    """Add H3-neighbor context features for spillover-aware tabular forecasts."""
    radius = cfg.get("forecast", {}).get("ring_radius", 1)
    out = df.copy()
    if radius < 1 or "h3" not in out.columns:
        out["ring_violation_total_mean"] = 0.0
        out["ring_cii_mean"] = 0.0
        return out

    static_values = (
        out.drop_duplicates("h3").set_index("h3")["violation_total"].to_dict()
        if "violation_total" in out.columns else {}
    )
    temporal_values = (
        out.set_index(["h3", "hour", "dow"])["cii"].to_dict()
        if {"cii", "hour", "dow"}.issubset(out.columns) else {}
    )

    ring_violation = []
    ring_cii = []
    neighbor_cache = {}
    for row in out.itertuples(index=False):
        cell = getattr(row, "h3")
        if cell not in neighbor_cache:
            neighbor_cache[cell] = _neighbors(cell, radius)
        neighbors = neighbor_cache[cell]

        static_neighbor_values = [static_values[n] for n in neighbors if n in static_values]
        ring_violation.append(
            float(sum(static_neighbor_values) / len(static_neighbor_values))
            if static_neighbor_values else 0.0
        )

        if hasattr(row, "hour") and hasattr(row, "dow"):
            temporal_neighbor_values = [
                temporal_values[(n, row.hour, row.dow)]
                for n in neighbors
                if (n, row.hour, row.dow) in temporal_values
            ]
        else:
            temporal_neighbor_values = []
        ring_cii.append(
            float(sum(temporal_neighbor_values) / len(temporal_neighbor_values))
            if temporal_neighbor_values else 0.0
        )

    out["ring_violation_total_mean"] = ring_violation
    out["ring_cii_mean"] = ring_cii
    return out

def train_climatology(train_df):
    """Train a naive climatology model: mean CII per (h3, hour, dow)."""
    return train_df.groupby(["h3", "hour", "dow"])["cii"].mean().reset_index(name="pred_cii")


def add_training_weights(df, cfg):
    target = cfg["forecast"].get("target_column", "target_next_3h_cii")
    high_target_weight = cfg["forecast"].get("high_target_weight", 5.0)
    out = df.copy()
    scaled = out[target].clip(lower=0)
    max_target = scaled.max()
    normalized = scaled / max_target if max_target > 0 else scaled
    out["training_weight"] = 1.0 + high_target_weight * normalized
    return out

def predict_climatology(model, test_df):
    """Predict CII using the climatology model, filling missing with 0."""
    res = test_df.merge(model, on=["h3", "hour", "dow"], how="left")
    res["pred_cii"] = res["pred_cii"].fillna(0.0)
    return res

def _model_params(cfg):
    defaults = {
        "n_estimators": 50,
        "random_state": 42,
        "n_jobs": 1,
    }
    defaults.update(cfg.get("forecast", {}).get("model", {}))
    return defaults


def _ensure_features(df, features, allow_fill=False):
    out = df.copy()
    missing = [f for f in features if f not in out.columns]
    if missing and not allow_fill:
        raise ValueError(f"Missing required features: {missing}")
    for feature in features:
        if feature not in out.columns:
            out[feature] = 0.0
    return out


def train_lgbm(train_df, cfg):
    """Train a LightGBM regressor for the configured forecast target."""
    forecast_cfg = cfg["forecast"]
    features = forecast_cfg["features"]
    target = forecast_cfg.get("target_column", "cii")

    df = _ensure_features(train_df, features)
    X = df[features]
    y = df[target]

    model = lgb.LGBMRegressor(**_model_params(cfg))
    sample_weight = df["training_weight"] if "training_weight" in df.columns else None
    model.fit(X, y, sample_weight=sample_weight)
    model.feature_names_ = features
    return model

def predict_lgbm(model, test_df, cfg):
    """Predict CII using trained LightGBM model."""
    forecast_cfg = cfg["forecast"]
    features = forecast_cfg["features"]
    pred_col = forecast_cfg.get("prediction_column", "pred_cii")

    df = _ensure_features(test_df, features, allow_fill=False)
    df[pred_col] = pd.Series(model.predict(df[features]), index=df.index).clip(lower=0)
    if pred_col != "pred_cii":
        df["pred_cii"] = df[pred_col]
    return df


def _minmax(series):
    low = series.min()
    high = series.max()
    if high == low:
        return series * 0.0
    return (series - low) / (high - low)


def _ranker_params(cfg):
    params = cfg.get("forecast", {}).get("ranker", {}).copy()
    params.pop("enabled", None)
    params.pop("relevance_bins", None)
    defaults = {
        "objective": "rank_xendcg",
        "n_estimators": 120,
        "learning_rate": 0.05,
        "num_leaves": 31,
        "random_state": 42,
        "n_jobs": 1,
        "force_col_wise": True,
    }
    defaults.update(params)
    return defaults


def make_ranking_relevance(df, cfg):
    forecast_cfg = cfg["forecast"]
    target = forecast_cfg.get("target_column", "target_next_3h_cii")
    bins = forecast_cfg.get("ranker", {}).get("relevance_bins", [0.0, 0.5, 2.0, 5.0, 15.0])
    return pd.cut(
        df[target].fillna(0.0),
        bins=[-float("inf")] + bins[1:] + [float("inf")],
        labels=False,
        include_lowest=True,
    ).astype(int)


def _rank_groups(df):
    ordered = df.sort_values("timestamp")
    group_sizes = ordered.groupby("timestamp", sort=False).size()
    valid_groups = group_sizes[group_sizes >= 2].index
    ordered = ordered[ordered["timestamp"].isin(valid_groups)]
    groups = ordered.groupby("timestamp", sort=False).size().tolist()
    return ordered, groups


def train_ranker(train_df, cfg):
    forecast_cfg = cfg["forecast"]
    features = forecast_cfg["features"]
    df = _ensure_features(train_df, features)
    ordered, groups = _rank_groups(df)
    if len(ordered) < 2 or not groups:
        return None
    y = make_ranking_relevance(ordered, cfg)
    model = lgb.LGBMRanker(**_ranker_params(cfg))
    model.fit(ordered[features], y, group=groups)
    model.feature_names_ = features
    return model


def predict_ranker(model, test_df, cfg):
    features = cfg["forecast"]["features"]
    out = _ensure_features(test_df, features, allow_fill=False)
    raw = pd.Series(model.predict(out[features]), index=out.index)
    out["rank_score"] = raw.groupby(out["timestamp"]).transform(_minmax).fillna(0.0)
    return out


def add_deployment_score(df, cfg):
    forecast_cfg = cfg["forecast"]
    pred_col = forecast_cfg.get("prediction_column", "pred_next_3h_cii")
    score_col = forecast_cfg.get("deployment_score_column", "deployment_score")
    blend = forecast_cfg.get("blend", {"regression": 1.0, "rank": 0.0})
    out = df.copy()
    regression_score = _minmax(out[pred_col].fillna(0.0))
    rank_score = out["rank_score"].fillna(0.0) if "rank_score" in out.columns else 0.0
    out[score_col] = (
        blend.get("regression", 1.0) * regression_score
        + blend.get("rank", 0.0) * rank_score
    ).clip(lower=0.0, upper=1.0)
    return out


def save_model_artifacts(model, cfg, output_dir, ranker=None):
    """Persist trained model, feature importance, and metadata."""
    os.makedirs(output_dir, exist_ok=True)
    forecast_cfg = cfg["forecast"]
    features = forecast_cfg["features"]
    metadata = {
        "target_column": forecast_cfg.get("target_column", "cii"),
        "prediction_column": forecast_cfg.get("prediction_column", "pred_cii"),
        "features": features,
        "model_params": _model_params(cfg),
        "ranker_enabled": ranker is not None,
        "ranker_params": _ranker_params(cfg) if ranker is not None else None,
        "blend": forecast_cfg.get("blend", {"regression": 1.0, "rank": 0.0}),
        "prepare_only_default": forecast_cfg.get("prepare_only_default", False),
    }

    joblib.dump(model, os.path.join(output_dir, "forecast_lgbm.joblib"))
    if ranker is not None:
        joblib.dump(ranker, os.path.join(output_dir, "forecast_ranker.joblib"))
        ranker_importance = pd.DataFrame({
            "feature": features,
            "importance": ranker.feature_importances_,
        }).sort_values("importance", ascending=False)
        ranker_importance.to_csv(os.path.join(output_dir, "forecast_ranker_feature_importance.csv"), index=False)
    importance = pd.DataFrame({
        "feature": features,
        "importance": model.feature_importances_,
    }).sort_values("importance", ascending=False)
    importance.to_csv(os.path.join(output_dir, "forecast_feature_importance.csv"), index=False)
    with open(os.path.join(output_dir, "forecast_model_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
