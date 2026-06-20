import math


def regression_metrics(df):
    """Return simple regression metrics for rows with actual and predicted CII."""
    if df.empty:
        return {"mae": 0.0, "rmse": 0.0, "rows": 0}
    errors = df["pred_cii"] - df["cii"]
    mae = float(errors.abs().mean())
    rmse = float(math.sqrt((errors ** 2).mean()))
    return {"mae": mae, "rmse": rmse, "rows": int(len(df))}


def top_k_overlap(df, k=25):
    """Share of actual top-k hotspots recovered by predicted top-k hotspots."""
    if df.empty or k <= 0:
        return 0.0
    k = min(k, len(df))
    actual = set(df.nlargest(k, "cii")["h3"])
    predicted = set(df.nlargest(k, "pred_cii")["h3"])
    if not actual:
        return 0.0
    return float(len(actual & predicted) / len(actual))


def top_k_recall(df, target_col, pred_col, k=25):
    """Share of actual top-k target hotspots recovered by predicted top-k."""
    if df.empty or k <= 0:
        return 0.0
    k = min(k, len(df))
    actual = set(df.nlargest(k, target_col)["h3"])
    predicted = set(df.nlargest(k, pred_col)["h3"])
    return float(len(actual & predicted) / len(actual)) if actual else 0.0


def ndcg_at_k(df, target_col, pred_col, k=25):
    """Normalized discounted cumulative gain for hotspot ranking quality."""
    if df.empty or k <= 0:
        return 0.0
    ranked = df.sort_values(pred_col, ascending=False).head(k)
    gains = ranked[target_col].tolist()
    dcg = sum(gain / math.log2(index + 2) for index, gain in enumerate(gains))
    ideal = df.sort_values(target_col, ascending=False).head(k)[target_col].tolist()
    idcg = sum(gain / math.log2(index + 2) for index, gain in enumerate(ideal))
    return float(dcg / idcg) if idcg else 0.0


def evaluate_forecast(df, target_col, pred_col, k_values=None):
    """Return regression and hotspot-ranking metrics for a forecast table."""
    k_values = k_values or [10, 25, 50]
    scored = df[[target_col, pred_col, "h3"]].dropna().copy()
    scored = scored.rename(columns={target_col: "cii", pred_col: "pred_cii"})
    metrics = regression_metrics(scored)
    for k in k_values:
        metrics[f"top{k}_recall"] = top_k_recall(df, target_col, pred_col, k=k)
        metrics[f"ndcg_at_{k}"] = ndcg_at_k(df, target_col, pred_col, k=k)
    return metrics


def deployment_roi(optimized, reactive):
    """Compare total expected relief from optimized and reactive deployment plans."""
    optimized_relief = float(optimized.get("expected_relief", 0).sum())
    reactive_relief = float(reactive.get("expected_relief", 0).sum())
    lift = optimized_relief - reactive_relief
    lift_pct = (lift / reactive_relief * 100.0) if reactive_relief else 0.0
    return {
        "optimized_relief": optimized_relief,
        "reactive_relief": reactive_relief,
        "lift": float(lift),
        "lift_pct": float(lift_pct),
    }


def evaluate_by_timestamp(df, target_col, pred_col, k=25):
    if df.empty:
        return {"timestamp_count": 0, f"mean_top{k}_recall": 0.0, f"mean_ndcg_at_{k}": 0.0}
    recalls = []
    ndcgs = []
    for _, group in df.groupby("timestamp"):
        recalls.append(top_k_recall(group, target_col, pred_col, k=k))
        ndcgs.append(ndcg_at_k(group, target_col, pred_col, k=k))
    return {
        "timestamp_count": int(df["timestamp"].nunique()),
        f"mean_top{k}_recall": float(sum(recalls) / len(recalls)) if recalls else 0.0,
        f"mean_ndcg_at_{k}": float(sum(ndcgs) / len(ndcgs)) if ndcgs else 0.0,
    }
