import pandas as pd
import os
import pydeck as pdk

def load_data_safe(path):
    """Load parquet file safely, return None if missing."""
    if os.path.exists(path):
        return pd.read_parquet(path)
    return None


def load_json_safe(path):
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        import json
        return json.load(f)


def load_csv_safe(path):
    if not os.path.exists(path):
        return None
    return pd.read_csv(path)


def load_stage4_artifacts(processed_dir):
    return {
        "cii": load_data_safe(os.path.join(processed_dir, "cell_cii.parquet")),
        "deployment": load_data_safe(os.path.join(processed_dir, "deployment_plan.parquet")),
        "reactive": load_data_safe(os.path.join(processed_dir, "reactive_deployment_plan.parquet")),
        "predictions": load_data_safe(os.path.join(processed_dir, "forecast_predictions.parquet")),
        "backtest_metrics": load_json_safe(os.path.join(processed_dir, "backtest_metrics.json")),
        "roi_metrics": load_json_safe(os.path.join(processed_dir, "roi_metrics.json")),
        "model_metadata": load_json_safe(os.path.join(processed_dir, "forecast_model_metadata.json")),
        "feature_importance": load_csv_safe(os.path.join(processed_dir, "forecast_feature_importance.csv")),
        "ranker_importance": load_csv_safe(os.path.join(processed_dir, "forecast_ranker_feature_importance.csv")),
    }


def required_stage4_artifacts():
    return [
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


def artifact_status(processed_dir, artifact_names=None):
    names = required_stage4_artifacts() if artifact_names is None else artifact_names
    rows = []
    for name in names:
        path = os.path.join(processed_dir, name)
        rows.append({
            "artifact": name,
            "exists": bool(os.path.exists(path)),
            "path": path,
            "size_mb": round(os.path.getsize(path) / (1024 * 1024), 3) if os.path.exists(path) else 0.0,
        })
    return pd.DataFrame(rows)


def validate_stage4_artifacts(processed_dir, artifact_names=None):
    status = artifact_status(processed_dir, artifact_names)
    return status.loc[~status["exists"], "artifact"].tolist()


def _dashboard_metric(value, default=None):
    if value is None or pd.isna(value):
        return default
    return value


def format_pct(value, digits=1):
    if value is None or pd.isna(value):
        return "N/A"
    return f"{float(value) * 100:.{digits}f}%"


def format_score(value, digits=3):
    if value is None or pd.isna(value):
        return "N/A"
    return f"{float(value):.{digits}f}"


def summarize_deployment(plan_df, roi_metrics=None, backtest_metrics=None):
    roi_metrics = roi_metrics or {}
    backtest_metrics = backtest_metrics or {}
    active = plan_df[plan_df["officers_assigned"] > 0] if plan_df is not None and "officers_assigned" in plan_df else pd.DataFrame()
    return {
        "officers_deployed": int(plan_df["officers_assigned"].sum()) if plan_df is not None and "officers_assigned" in plan_df else 0,
        "active_cells": int(len(active)),
        "expected_relief": float(plan_df["expected_relief"].sum()) if plan_df is not None and "expected_relief" in plan_df else 0.0,
        "forecast_pressure": float(plan_df["forecast_cii"].sum()) if plan_df is not None and "forecast_cii" in plan_df else 0.0,
        "lift_pct": float(_dashboard_metric(roi_metrics.get("lift_pct"), 0.0)),
        "deployment_score_top25_recall": _dashboard_metric(backtest_metrics.get("deployment_score_top25_recall")),
        "mean_ndcg_at_25": _dashboard_metric(backtest_metrics.get("mean_ndcg_at_25")),
    }


def get_h3_layer(df, color_column):
    """Generate a Pydeck H3 layer."""
    layer_df = df.copy()
    if color_column not in layer_df.columns:
        layer_df[color_column] = 0.0
    layer_df[color_column] = pd.to_numeric(layer_df[color_column], errors="coerce").fillna(0.0)
    max_val = layer_df[color_column].max() if not layer_df.empty else 1.0
    max_val = max_val if pd.notna(max_val) and max_val > 0 else 1.0
    
    return pdk.Layer(
        "H3HexagonLayer",
        layer_df,
        get_hexagon="h3",
        get_fill_color=f"[255, (1 - {color_column} / {max_val}) * 255, 0, 170]",
        get_elevation=f"{color_column}",
        elevation_scale=50,
        pickable=True,
        extruded=True,
    )


def available_display_columns(df, preferred):
    """Return preferred columns that exist in the dataframe."""
    return [col for col in preferred if col in df.columns]


def deployment_display_columns(df):
    """Return deployment table columns in judge-facing display order."""
    return available_display_columns(df, [
        "top_location",
        "top_junction",
        "top_police_station",
        "officers_assigned",
        "deployment_score",
        "pred_next_3h_cii",
        "rank_score",
        "expected_relief",
        "forecast_cii",
        "current_violation_count",
        "support_score",
        "data_quality_score",
        "h3",
    ])


def format_hotspot_label(row):
    """Return the best human-readable hotspot label for a table row."""
    for key in ("top_location", "top_junction", "h3"):
        value = row.get(key)
        if pd.notna(value) and str(value).strip() and str(value).strip().lower() != "no junction":
            return str(value)
    return "Unknown hotspot"


def prepare_map_dataframe(cii_df, deployment_df):
    """Return CII rows enriched with deployment and forecast map context."""
    deployment_columns = [
        "deployment_score",
        "pred_next_3h_cii",
        "rank_score",
        "officers_assigned",
        "expected_relief",
        "forecast_cii",
    ]
    map_df = cii_df.copy()

    if deployment_df is not None and "h3" in deployment_df.columns:
        available_columns = ["h3"] + [
            col for col in deployment_columns if col in deployment_df.columns
        ]
        existing_deployment_columns = [
            col for col in deployment_columns if col in map_df.columns
        ]
        if existing_deployment_columns:
            map_df = map_df.drop(columns=existing_deployment_columns)
        deployment_map_df = deployment_df[available_columns].copy()
        priority_columns = [
            col
            for col in ["officers_assigned", "deployment_score", "expected_relief"]
            if col in deployment_map_df.columns
        ]
        if priority_columns:
            deployment_map_df = deployment_map_df.sort_values(
                priority_columns,
                ascending=[False] * len(priority_columns),
                kind="mergesort",
            )
        deployment_map_df = deployment_map_df.drop_duplicates("h3", keep="first")
        map_df = map_df.merge(
            deployment_map_df,
            on="h3",
            how="left",
        )

    for col in deployment_columns:
        if col not in map_df.columns:
            map_df[col] = 0.0
        map_df[col] = map_df[col].fillna(0.0)

    map_df["map_label"] = map_df.apply(format_hotspot_label, axis=1)
    return map_df


def cii_component_columns(df):
    """Return available CII component columns in display order."""
    preferred = [
        "base_impact",
        "capacity_component",
        "temporal_component",
        "chronic_component",
        "confidence_score",
    ]
    return available_display_columns(df, preferred)
