import math

import numpy as np
import pandas as pd


def explode_violations(df):
    """One row per (record x violation); empty violation lists drop out."""
    e = df.explode("violation_list").rename(columns={"violation_list": "violation"})
    return e.dropna(subset=["violation"]).reset_index(drop=True)


def cell_time_counts(df):
    """Violation counts per (h3, hour, dow)."""
    e = explode_violations(df)
    return e.groupby(["h3", "hour", "dow"]).size().reset_index(name="count")


def cell_totals(df):
    """Total violations per H3 cell."""
    e = explode_violations(df)
    return e.groupby("h3").size().reset_index(name="total")


def station_totals(df):
    """Total violations per police station."""
    e = explode_violations(df)
    return e.groupby("police_station").size().reset_index(name="violations")


def _top_value(series):
    values = series.dropna()
    if values.empty:
        return None
    return values.value_counts().index[0]


def _top_values(series, limit=3):
    values = series.dropna()
    if values.empty:
        return None
    return " | ".join(str(v) for v in values.value_counts().head(limit).index)


def _count_value(series, value):
    return int(series.fillna("").str.lower().eq(value).sum())


def _no_junction_count(series):
    return int(series.fillna("").str.strip().str.lower().eq("no junction").sum())


def _named_junction_count(series):
    values = series.fillna("").str.strip()
    return int(((values != "") & (values.str.lower() != "no junction")).sum())


def cell_area_summary(df):
    """Human-readable, dataset-native area context per H3 cell."""
    exploded_totals = cell_totals(df).rename(columns={"total": "violation_total"})
    rows = []
    for h3_cell, group in df.groupby("h3"):
        status = group["validation_status"] if "validation_status" in group else group["h3"].iloc[0:0]
        approved_count = _count_value(status, "approved")
        rejected_count = _count_value(status, "rejected")
        unvalidated_count = int(status.isna().sum()) if len(status) else 0
        record_count = int(len(group))
        approved_rate = approved_count / record_count if record_count else 0.0
        rejected_rate = rejected_count / record_count if record_count else 0.0
        unknown_rate = unvalidated_count / record_count if record_count else 0.0
        support_score = min(1.0, math.log1p(record_count) / math.log1p(100)) if record_count else 0.0
        rows.append({
            "h3": h3_cell,
            "record_count": record_count,
            "support_score": support_score,
            "unique_location_count": int(group["location"].nunique(dropna=True)) if "location" in group else 0,
            "top_location": _top_value(group["location"]) if "location" in group else None,
            "top_locations": _top_values(group["location"]) if "location" in group else None,
            "top_junction": _top_value(group["junction_name"]) if "junction_name" in group else None,
            "has_named_junction": _named_junction_count(group["junction_name"]) > 0 if "junction_name" in group else False,
            "no_junction_count": _no_junction_count(group["junction_name"]) if "junction_name" in group else 0,
            "top_police_station": _top_value(group["police_station"]) if "police_station" in group else None,
            "centroid_latitude": float(group["latitude"].mean()),
            "centroid_longitude": float(group["longitude"].mean()),
            "approved_count": approved_count,
            "rejected_count": rejected_count,
            "unvalidated_count": unvalidated_count,
            "approved_rate": approved_rate,
            "rejected_rate": rejected_rate,
            "data_quality_score": max(0.0, min(1.0, approved_rate + 0.5 * unknown_rate - rejected_rate)),
        })
    out = exploded_totals.merge(pd.DataFrame(rows), on="h3", how="outer")
    out["violation_total"] = out["violation_total"].fillna(0).astype(int)
    out["location_count_log"] = np.log1p(out["unique_location_count"].fillna(0))
    out["station_count_log"] = np.log1p(out["top_police_station"].notna().astype(int))
    out["junction_count_log"] = np.log1p(out["has_named_junction"].fillna(False).astype(int))
    if len(out) == 1:
        out["cell_total_rank_pct"] = 1.0
    else:
        out["cell_total_rank_pct"] = out["violation_total"].rank(method="average", pct=True)
    out["location_count"] = out["unique_location_count"].fillna(0).astype(int)
    return out
