import logging
import math
from typing import Any

import pandas as pd
import h3

logger = logging.getLogger(__name__)

from src.app_utils import format_hotspot_label, prepare_map_dataframe, summarize_deployment
from src.curb_intelligence import (
    build_mission_card,
    classify_lifecycle,
    compute_capacity_theft,
    compute_opportunity_gap,
    compute_time_to_criticality,
    fingerprint_hotspot,
)


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

MAX_SEARCH_SUGGESTIONS = 5000

FORECAST_CONTEXT_COLUMNS = [
    "h3",
    "timestamp",
    "current_cii",
    "current_violation_count",
    "capacity_ratio",
    "current_capacity_ratio",
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
    "lanes",
    "hour",
    "pred_next_1h_cii",
    "pred_next_1h_cii_proxy",
    "pred_next_2h_cii",
    "pred_next_2h_cii_proxy",
    "pred_next_3h_cii",
    "forecast_cii",
    "forecast_horizon_source",
]


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


def _forecast_context_df(artifacts):
    predictions = artifacts.get("predictions")
    if predictions is None or predictions.empty or "h3" not in predictions.columns:
        return pd.DataFrame()
    context = _ensure_horizon_columns(predictions)
    cols = [col for col in FORECAST_CONTEXT_COLUMNS if col in context.columns]
    context = context[cols].copy()
    sort_cols = [col for col in ["pred_next_3h_cii", "current_cii", "timestamp"] if col in context.columns]
    if sort_cols:
        context = context.sort_values(sort_cols, ascending=[False] * len(sort_cols), kind="mergesort")
    return context.drop_duplicates("h3", keep="first")


def _deployment_with_forecast_context(artifacts):
    deployment = _deployment_df(artifacts)
    context = _forecast_context_df(artifacts)
    if deployment.empty or context.empty or "h3" not in deployment.columns:
        return deployment
    context_cols = [col for col in context.columns if col == "h3" or col not in ["label"]]
    overlap = [col for col in context_cols if col != "h3" and col in deployment.columns]
    renamed = {col: f"{col}__forecast" for col in overlap}
    incoming = context[context_cols].rename(columns=renamed)
    out = deployment.merge(incoming, on="h3", how="left")
    for col in overlap:
        forecast_col = renamed[col]
        out[col] = out[forecast_col].combine_first(out[col])
        out = out.drop(columns=[forecast_col])
    return out


def _apply_filters(df, station=None, min_support=0.0, query=None, h3=None):
    if df is None or df.empty:
        return pd.DataFrame()
    out = df.copy()
    if h3 and "h3" in out.columns:
        return out[out["h3"] == h3]
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


def build_filter_options(plan_df, raw_locations=None, h3_resolution=9):
    if plan_df is None or plan_df.empty:
        return {"stations": [], "suggestions": [], "support": {"min": 0.0, "max": 1.0}}
    stations = []
    if "top_police_station" in plan_df.columns:
        stations = sorted(str(s) for s in plan_df["top_police_station"].dropna().unique())
    suggestions = build_search_suggestions(plan_df, raw_locations=raw_locations, h3_resolution=h3_resolution)
    if "support_score" in plan_df.columns:
        support = pd.to_numeric(plan_df["support_score"], errors="coerce").dropna()
        if not support.empty:
            return {
                "stations": stations,
                "suggestions": suggestions,
                "support": {"min": float(support.min()), "max": float(support.max())},
            }
    return {"stations": stations, "suggestions": suggestions, "support": {"min": 0.0, "max": 1.0}}


def _raw_locations_to_suggestion_frame(raw_locations, h3_resolution=9):
    if raw_locations is None or raw_locations.empty or "location" not in raw_locations.columns:
        return pd.DataFrame()
    out = raw_locations.copy()
    out["top_location"] = out["location"].fillna("").astype(str).str.strip()
    out = out[out["top_location"] != ""]
    if out.empty:
        return pd.DataFrame()
    if "police_station" in out.columns:
        out["top_police_station"] = out["police_station"]
    if "junction_name" in out.columns:
        out["top_junction"] = out["junction_name"]
    if "h3" not in out.columns and {"latitude", "longitude"}.issubset(out.columns):
        def _cell(row):
            lat = pd.to_numeric(row.get("latitude"), errors="coerce")
            lng = pd.to_numeric(row.get("longitude"), errors="coerce")
            if pd.isna(lat) or pd.isna(lng):
                return None
            try:
                return h3.latlng_to_cell(float(lat), float(lng), int(h3_resolution))
            except Exception:
                return None

        out["h3"] = out.apply(_cell, axis=1)
    out["__count"] = out.groupby("top_location")["top_location"].transform("count")
    return out.sort_values(["__count", "top_location"], ascending=[False, True], kind="mergesort")


def build_search_suggestions(plan_df, raw_locations=None, h3_resolution=9, limit=MAX_SEARCH_SUGGESTIONS):
    source = _raw_locations_to_suggestion_frame(raw_locations, h3_resolution=h3_resolution)
    if source.empty:
        source = plan_df
    if source is None or source.empty or "top_location" not in source.columns:
        return []
    out = _with_labels(source)
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


def build_overview_payload(artifacts, artifact_rows=None, h3_resolution=9):
    deployment = _deployment_df(artifacts)
    raw_locations = artifacts.get("raw_violations") if artifacts else None
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
        "filters": build_filter_options(deployment, raw_locations=raw_locations, h3_resolution=h3_resolution),
        "artifacts": _artifact_records(artifact_rows),
    }


def build_hotspot_rows(artifacts, station=None, min_support=0.0, query=None, h3=None, limit=250):
    deployment = _with_labels(_deployment_df(artifacts))
    deployment = _apply_filters(deployment, station=station, min_support=min_support, query=query, h3=h3)
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


def build_map_rows(artifacts, station=None, min_support=0.0, query=None, h3=None, limit=1000):
    cii_df = artifacts.get("cii")
    deployment = _deployment_df(artifacts)
    if cii_df is None:
        cii_df = pd.DataFrame(columns=["h3"])
    if not cii_df.empty and not deployment.empty and "h3" in cii_df.columns and "h3" in deployment.columns:
        cii_df = cii_df[cii_df["h3"].isin(deployment["h3"].dropna().unique())]
    map_df = prepare_map_dataframe(cii_df, deployment) if not cii_df.empty else _with_labels(deployment)
    map_df = _with_labels(map_df)
    map_df = _apply_filters(map_df, station=station, min_support=min_support, query=query, h3=h3)
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


def _optimizer_settings():
    return {"effectiveness": 0.35, "decay": 0.55}


def _ensure_horizon_columns(df):
    if df is None or df.empty:
        return pd.DataFrame()
    out = df.copy()
    if "pred_next_3h_cii" in out.columns and "pred_next_1h_cii" not in out.columns:
        out["pred_next_1h_cii_proxy"] = pd.to_numeric(out["pred_next_3h_cii"], errors="coerce").fillna(0.0) / 3.0
    if "pred_next_3h_cii" in out.columns and "pred_next_2h_cii" not in out.columns:
        out["pred_next_2h_cii_proxy"] = pd.to_numeric(out["pred_next_3h_cii"], errors="coerce").fillna(0.0) * 2.0 / 3.0
    out["forecast_horizon_source"] = "learned" if "pred_next_1h_cii" in out.columns else "proxy_from_next_3h"
    return out


def _with_intelligence_columns(df):
    if df is None or df.empty:
        return pd.DataFrame()
    out = _ensure_horizon_columns(_with_labels(df))
    out = out.copy()
    out["capacity_theft"] = out.apply(lambda row: compute_capacity_theft(row.to_dict()), axis=1)
    out["lifecycle"] = out.apply(lambda row: classify_lifecycle(row.to_dict()), axis=1)
    out["criticality"] = out.apply(lambda row: compute_time_to_criticality(row.to_dict()), axis=1)
    out["fingerprint"] = out.apply(lambda row: fingerprint_hotspot(row.to_dict()), axis=1)
    out["opportunity_gap"] = out.apply(lambda row: compute_opportunity_gap(row.to_dict()), axis=1)
    return out


def build_intelligence_payload(artifacts, station=None, query=None, h3=None, limit=100):
    deployment = _apply_filters(_deployment_with_forecast_context(artifacts), station=station, query=query, h3=h3)
    deployment = _with_intelligence_columns(deployment)
    if "deployment_score" in deployment.columns:
        deployment = deployment.sort_values("deployment_score", ascending=False, kind="mergesort")
    rows = deployment.head(int(limit)) if limit else deployment
    return {
        "rows": _records(rows),
        "summary": {
            "hotspots": int(len(deployment)),
            "critical": int((deployment["lifecycle"].isin(["active", "spreading", "chronic"])).sum()) if "lifecycle" in deployment else 0,
            "opportunity_gap_total": float(pd.to_numeric(deployment.get("opportunity_gap", 0.0), errors="coerce").fillna(0.0).sum()) if not deployment.empty else 0.0,
        },
    }


def build_timeline_payload(artifacts, station=None, query=None, h3=None, limit=150):
    predictions = artifacts.get("predictions")
    deployment = _deployment_df(artifacts)
    if predictions is None or predictions.empty:
        return {"horizons": [], "rows": []}
    rows = _ensure_horizon_columns(predictions)
    if "h3" in rows.columns and not deployment.empty and "h3" in deployment.columns:
        meta_cols = [col for col in ["h3", "label", "top_location", "top_police_station", "deployment_score", "officers_assigned", "expected_relief"] if col in deployment.columns]
        # Only merge columns that don't already exist to avoid _x/_y suffixes
        cols_from_deployment = [c for c in meta_cols if c == "h3" or c not in rows.columns]
        if len(cols_from_deployment) > 1:
            rows = rows.merge(_with_labels(deployment)[cols_from_deployment].drop_duplicates("h3"), on="h3", how="left")
    rows = _apply_filters(rows, station=station, query=query, h3=h3)
    if "pred_next_3h_cii" in rows.columns:
        rows = rows.sort_values("pred_next_3h_cii", ascending=False, kind="mergesort")
    rows = rows.head(int(limit))
    # Add intelligence columns so frontend has capacity_theft, lifecycle, etc.
    rows = _with_intelligence_columns(rows)
    return {
        "horizons": ["now", "+60m", "+3h", "pattern"],
        "horizon_source": "learned" if "pred_next_1h_cii" in rows.columns else "proxy_from_next_3h",
        "rows": _records(rows),
    }


def build_mission_payload(artifacts, station=None, query=None, h3=None, limit=40):
    deployment = _apply_filters(_deployment_with_forecast_context(artifacts), station=station, query=query, h3=h3)
    deployment = _with_intelligence_columns(deployment)
    if "deployment_score" in deployment.columns:
        deployment = deployment.sort_values("deployment_score", ascending=False, kind="mergesort")
    settings = _optimizer_settings()
    cards = [
        build_mission_card(row, settings["effectiveness"], settings["decay"])
        for row in _records(deployment.head(int(limit)))
    ]
    return {"rows": cards}
