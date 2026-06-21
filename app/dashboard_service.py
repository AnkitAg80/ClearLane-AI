import math
from typing import Any

import pandas as pd

from src.app_utils import format_hotspot_label, prepare_map_dataframe, summarize_deployment


HOTSPOT_COLUMNS = [
    "h3",
    "label",
    "top_location",
    "top_junction",
    "top_police_station",
    "deployment_score",
    "pred_next_3h_cii",
    "rank_score",
    "expected_relief",
    "officers_assigned",
    "forecast_cii",
    "current_cii",
    "current_violation_count",
    "support_score",
    "data_quality_score",
]

SIGNAL_COLUMNS = [
    "current_cii",
    "current_violation_count",
    "capacity_ratio",
    "current_capacity_component",
    "current_temporal_component",
    "current_chronic_component",
    "cii_lag_1h",
    "cii_lag_3h",
    "cii_roll_3h_mean",
    "cii_same_hour_1d",
    "cii_ewm_3h",
    "ring1_current_cii_mean",
    "ring1_active_neighbor_count",
    "support_score",
    "data_quality_score",
]

METRIC_COLUMNS = [
    "deployment_score",
    "pred_next_3h_cii",
    "remaining_next_3h_cii",
    "cii",
    "current_cii",
    "officers_assigned",
    "expected_relief",
    "forecast_cii",
    "support_score",
    "data_quality_score",
]

MAX_SEARCH_SUGGESTIONS = 500


def _json_scalar(value: Any):
    if value is None:
        return None
    if pd.isna(value):
        return None
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    if hasattr(value, "item"):
        return value.item()
    return value


def _records(df):
    if df is None or df.empty:
        return []
    clean = df.replace([math.inf, -math.inf], pd.NA).where(pd.notnull(df), None)
    return [
        {key: _json_scalar(value) for key, value in row.items()}
        for row in clean.to_dict(orient="records")
    ]


def _artifact_records(artifact_rows):
    if artifact_rows is None:
        return []
    if isinstance(artifact_rows, pd.DataFrame):
        return _records(artifact_rows)
    return [
        {key: _json_scalar(value) for key, value in row.items()}
        for row in artifact_rows
    ]


def _deployment_df(artifacts):
    deployment = artifacts.get("deployment")
    return deployment.copy() if deployment is not None else pd.DataFrame()


def _apply_filters(df, station=None, min_support=0.0, query=None):
    if df is None or df.empty:
        return pd.DataFrame()
    out = df.copy()
    if station and station != "ALL" and "top_police_station" in out.columns:
        out = out[out["top_police_station"] == station]
    if min_support is not None and "support_score" in out.columns:
        out = out[pd.to_numeric(out["support_score"], errors="coerce").fillna(0.0) >= float(min_support)]
    if query:
        q = str(query).strip().lower()
        if q:
            search_cols = [col for col in ["label", "top_location", "top_junction", "top_police_station", "h3"] if col in out.columns]
            if search_cols:
                mask = pd.Series(False, index=out.index)
                for col in search_cols:
                    mask = mask | out[col].fillna("").astype(str).str.lower().str.contains(q, regex=False)
                out = out[mask]
    return out


def _with_labels(df):
    if df is None or df.empty:
        return pd.DataFrame()
    out = df.copy()
    if "label" not in out.columns:
        out["label"] = out.apply(format_hotspot_label, axis=1)
    return out


def build_filter_options(plan_df):
    if plan_df is None or plan_df.empty:
        return {"stations": [], "suggestions": [], "support": {"min": 0.0, "max": 1.0}}
    stations = []
    if "top_police_station" in plan_df.columns:
        stations = sorted(str(s) for s in plan_df["top_police_station"].dropna().unique())
    suggestions = build_search_suggestions(plan_df)
    if "support_score" in plan_df.columns:
        support = pd.to_numeric(plan_df["support_score"], errors="coerce").dropna()
        if not support.empty:
            return {
                "stations": stations,
                "suggestions": suggestions,
                "support": {"min": float(support.min()), "max": float(support.max())},
            }
    return {"stations": stations, "suggestions": suggestions, "support": {"min": 0.0, "max": 1.0}}


def build_search_suggestions(plan_df, limit=MAX_SEARCH_SUGGESTIONS):
    if plan_df is None or plan_df.empty or "top_location" not in plan_df.columns:
        return []
    out = _with_labels(plan_df)
    out = out.copy()
    out["__location"] = out["top_location"].fillna("").astype(str).str.strip()
    out = out[out["__location"] != ""]
    if out.empty:
        return []
    if "deployment_score" in out.columns:
        out["__score"] = pd.to_numeric(out["deployment_score"], errors="coerce").fillna(0.0)
        out = out.sort_values("__score", ascending=False, kind="mergesort")
    out = out.drop_duplicates("__location", keep="first")
    if limit:
        out = out.head(int(limit))

    suggestions = []
    for row in _records(out):
        junction = row.get("top_junction")
        if junction == "No Junction":
            junction = None
        station = row.get("top_police_station")
        parts = [part for part in [station, junction] if part]
        suggestions.append({
            "type": "location",
            "label": row.get("__location"),
            "value": row.get("__location"),
            "station": station,
            "junction": junction,
            "h3": row.get("h3"),
            "secondary": " · ".join(parts) if parts else row.get("h3"),
        })
    return suggestions


def build_overview_payload(artifacts, artifact_rows=None):
    deployment = _deployment_df(artifacts)
    backtest = artifacts.get("backtest_metrics") or {}
    roi = artifacts.get("roi_metrics") or {}
    return {
        "summary": summarize_deployment(deployment, roi, backtest),
        "highlights": {
            "lift_pct": _json_scalar(roi.get("lift_pct", 0.0)),
            "optimized_relief": _json_scalar(roi.get("optimized_relief")),
            "reactive_relief": _json_scalar(roi.get("reactive_relief")),
            "deployment_score_top25_recall": _json_scalar(backtest.get("deployment_score_top25_recall")),
            "deployment_score_ndcg_at_25": _json_scalar(backtest.get("deployment_score_ndcg_at_25")),
        },
        "filters": build_filter_options(deployment),
        "artifacts": _artifact_records(artifact_rows),
    }


def build_hotspot_rows(artifacts, station=None, min_support=0.0, query=None, limit=250):
    deployment = _with_labels(_deployment_df(artifacts))
    deployment = _apply_filters(deployment, station=station, min_support=min_support, query=query)
    if "deployment_score" in deployment.columns:
        deployment = deployment.sort_values("deployment_score", ascending=False, kind="mergesort")
    cols = [col for col in HOTSPOT_COLUMNS if col in deployment.columns]
    if limit:
        deployment = deployment.head(int(limit))
    return _records(deployment[cols] if cols else deployment)


def _dedupe_map_cells(map_df):
    if map_df is None or map_df.empty or "h3" not in map_df.columns:
        return map_df
    out = map_df.copy()
    sort_columns = [
        col for col in [
            "deployment_score",
            "officers_assigned",
            "pred_next_3h_cii",
            "expected_relief",
            "cii",
            "current_cii",
            "support_score",
            "data_quality_score",
        ] if col in out.columns
    ]
    temp_columns = []
    for col in sort_columns:
        temp_col = f"__sort_{col}"
        out[temp_col] = pd.to_numeric(out[col], errors="coerce").fillna(0.0)
        temp_columns.append(temp_col)
    if temp_columns:
        out = out.sort_values(temp_columns, ascending=[False] * len(temp_columns), kind="mergesort")
    out = out.drop_duplicates("h3", keep="first")
    return out.drop(columns=temp_columns) if temp_columns else out


def _attach_remaining_cii(map_df):
    if map_df is None or map_df.empty:
        return map_df
    out = map_df.copy()
    predicted = pd.to_numeric(out.get("pred_next_3h_cii", 0.0), errors="coerce").fillna(0.0)
    relief = pd.to_numeric(out.get("expected_relief", 0.0), errors="coerce").fillna(0.0)
    out["remaining_next_3h_cii"] = (predicted - relief).clip(lower=0.0)
    return out


def build_map_rows(artifacts, station=None, min_support=0.0, query=None, limit=300):
    cii_df = artifacts.get("cii")
    deployment = _deployment_df(artifacts)
    if cii_df is None:
        cii_df = pd.DataFrame(columns=["h3"])
    if not cii_df.empty and not deployment.empty and "h3" in cii_df.columns and "h3" in deployment.columns:
        cii_df = cii_df[cii_df["h3"].isin(deployment["h3"].dropna().unique())]
    map_df = prepare_map_dataframe(cii_df, deployment) if not cii_df.empty else _with_labels(deployment)
    map_df = _with_labels(map_df)
    map_df = _apply_filters(map_df, station=station, min_support=min_support, query=query)
    map_df = _dedupe_map_cells(map_df)
    map_df = _attach_remaining_cii(map_df)
    if "deployment_score" in map_df.columns:
        map_df = map_df.sort_values("deployment_score", ascending=False, kind="mergesort")
    if limit:
        map_df = map_df.head(int(limit))
    rows = []
    for row in _records(map_df):
        row["metric_values"] = {
            metric: row.get(metric) or 0
            for metric in METRIC_COLUMNS
        }
        rows.append(row)
    return rows


def build_hotspot_detail(artifacts, h3_cell):
    deployment = _with_labels(_deployment_df(artifacts))
    if deployment.empty or "h3" not in deployment.columns:
        return None
    matched = deployment[deployment["h3"] == h3_cell]
    if matched.empty:
        return None
    match = _records(matched.head(1))[0]
    scorecards = {
        key: match.get(key)
        for key in [
            "deployment_score",
            "pred_next_3h_cii",
            "rank_score",
            "officers_assigned",
            "expected_relief",
            "forecast_cii",
            "support_score",
            "data_quality_score",
        ]
        if key in match
    }
    signals = [
        {"name": key, "value": match.get(key)}
        for key in SIGNAL_COLUMNS
        if key in match and match.get(key) is not None
    ]
    return {
        "h3": match.get("h3"),
        "title": match.get("label") or match.get("top_location") or match.get("h3"),
        "station": match.get("top_police_station"),
        "location": match.get("top_location"),
        "junction": match.get("top_junction"),
        "scorecards": scorecards,
        "signals": signals,
        "raw": match,
    }


def build_deployment_payload(artifacts):
    deployment = _with_labels(_deployment_df(artifacts))
    reactive = artifacts.get("reactive")
    roi = artifacts.get("roi_metrics") or {}
    if "deployment_score" in deployment.columns:
        deployment = deployment.sort_values("deployment_score", ascending=False, kind="mergesort")
    return {
        "totals": {
            "optimized_relief": _json_scalar(roi.get("optimized_relief")),
            "reactive_relief": _json_scalar(roi.get("reactive_relief")),
            "lift_pct": _json_scalar(roi.get("lift_pct", 0.0)),
            "optimized_officers": int(deployment["officers_assigned"].sum()) if "officers_assigned" in deployment else 0,
            "reactive_officers": int(reactive["officers_assigned"].sum()) if reactive is not None and "officers_assigned" in reactive else 0,
        },
        "optimized": build_hotspot_rows(artifacts, limit=250),
        "reactive": _records(reactive),
    }


def build_evidence_payload(artifacts, artifact_rows=None):
    model = artifacts.get("model_metadata") or {}
    return {
        "backtest": {
            key: _json_scalar(value)
            for key, value in (artifacts.get("backtest_metrics") or {}).items()
        },
        "roi": {
            key: _json_scalar(value)
            for key, value in (artifacts.get("roi_metrics") or {}).items()
        },
        "model": {
            "target_column": model.get("target_column"),
            "prediction_column": model.get("prediction_column"),
            "ranker_enabled": bool(model.get("ranker_enabled")),
            "features": model.get("features", []),
        },
        "feature_importance": {
            "regression": _records(artifacts.get("feature_importance")),
            "ranker": _records(artifacts.get("ranker_importance")),
        },
        "artifacts": _artifact_records(artifact_rows),
    }
