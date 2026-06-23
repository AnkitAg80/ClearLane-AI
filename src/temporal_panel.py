import h3
import pandas as pd


NUMERIC_METADATA_COLUMNS = [
    "record_count",
    "support_score",
    "data_quality_score",
    "approved_rate",
    "rejected_rate",
    "location_count",
    "location_count_log",
    "station_count_log",
    "no_junction_count",
    "junction_count_log",
    "cell_total_rank_pct",
    "violation_total",
]
OPTIONAL_METADATA_COLUMNS = [
    "top_location",
    "top_junction",
    "top_police_station",
    "centroid_latitude",
    "centroid_longitude",
    "unique_location_count",
]
BASE_COLUMNS = [
    "h3",
    "timestamp",
    "current_violation_count",
    "current_cii",
    "current_base_impact",
    "current_capacity_ratio",
    "capacity_ratio",
    "current_capacity_component",
    "current_chronic_component",
    "current_temporal_component",
    "lanes",
    "confidence_score",
    *NUMERIC_METADATA_COLUMNS,
    "hour",
    "dow",
    "month",
    "is_weekend",
    "capacity_stolen_pct",
    "time_to_criticality_mins",
    "lifecycle_stage",
]


def _rush_weight_for_hour(hour, cfg):
    weights = cfg.get("cii", {}).get("rush_hour_weights", {"default": 1.0})
    for name, peak in weights.items():
        if name == "default":
            continue
        if peak["start"] <= hour < peak["end"]:
            return float(peak["weight"])
    return float(weights.get("default", 1.0))


def _apply_hourly_cii_components(panel, cfg):
    cii_cfg = cfg.get("cii", {})
    alpha = cii_cfg.get("bpr_alpha", 0.15)
    beta = cii_cfg.get("bpr_beta", 4)
    lane_capacity = cii_cfg.get("lane_capacity_proxy", 100)
    ratio_cap = cii_cfg.get("bpr_ratio_cap", 3.0)

    out = panel.copy()
    out["current_base_impact"] = out["current_cii"]
    capacity = (out["lanes"].fillna(1).clip(lower=1) * lane_capacity).clip(lower=1)
    out["current_capacity_ratio"] = (out["current_base_impact"] / capacity).clip(upper=ratio_cap)
    out["capacity_ratio"] = out["current_capacity_ratio"]
    out["current_capacity_component"] = 1 + alpha * (out["current_capacity_ratio"] ** beta)
    out["current_temporal_component"] = out["timestamp"].dt.hour.apply(lambda hour: _rush_weight_for_hour(hour, cfg))

    out["current_chronic_component"] = 1.0
    if "current_violation_count" in out.columns and not out.empty:
        chronic_cfg = cii_cfg.get("recurrence_bonus", {"threshold_days": 5, "multiplier": 1.5})
        chron_thresh = chronic_cfg.get("threshold_days", 5)
        chron_mult = chronic_cfg.get("multiplier", 1.5)
        active = out[out["current_violation_count"] > 0]
        if not active.empty:
            cell_unique_days = (
                active.groupby("h3")["timestamp"]
                .apply(lambda s: s.dt.date.nunique())
                .to_dict()
            )
            out["current_chronic_component"] = out["h3"].map(
                lambda h: chron_mult if cell_unique_days.get(h, 0) >= chron_thresh else 1.0
            )

    out["current_cii"] = (
        out["current_base_impact"]
        * out["current_capacity_component"]
        * out["current_temporal_component"]
        * out["current_chronic_component"]
    )
    
    # Calculate intelligence features
    from src.curb_intelligence import compute_capacity_theft, compute_time_to_criticality, classify_lifecycle
    
    out["capacity_stolen_pct"] = out.apply(
        lambda r: compute_capacity_theft(r.to_dict())["capacity_theft_pct"], axis=1
    )
    def _safe_ttc(r):
        result = compute_time_to_criticality(r.to_dict())["time_to_criticality_minutes"]
        return result if result is not None else 999
    out["time_to_criticality_mins"] = out.apply(_safe_ttc, axis=1)
    out["lifecycle_stage"] = out.apply(
        lambda r: classify_lifecycle(r.to_dict()), axis=1
    )
    
    return out


def _hour_floor(series, freq):
    return pd.to_datetime(series, errors="coerce", utc=True).dt.floor(freq)


def _optional_metadata_columns(area_df):
    return [col for col in OPTIONAL_METADATA_COLUMNS if col in area_df.columns]


def _panel_columns(area_df):
    return BASE_COLUMNS + _optional_metadata_columns(area_df)


def _empty_panel(area_df):
    return pd.DataFrame(columns=_panel_columns(area_df))


def _add_metadata(panel, area_df):
    if "h3" in area_df.columns:
        keep = ["h3", *NUMERIC_METADATA_COLUMNS, *OPTIONAL_METADATA_COLUMNS]
        area_cols = [col for col in keep if col in area_df.columns]
        panel = panel.merge(area_df[area_cols].drop_duplicates("h3"), on="h3", how="left")

    for col in NUMERIC_METADATA_COLUMNS:
        if col not in panel.columns:
            panel[col] = 0.0
        else:
            panel[col] = panel[col].fillna(0.0)
    for col in _optional_metadata_columns(area_df):
        if col not in panel.columns:
            panel[col] = pd.NA
    return panel


def build_hourly_panel(weighted_df, area_df, cfg):
    freq = cfg.get("forecast", {}).get("bucket_freq", "1h")
    max_panel_rows = cfg.get("forecast", {}).get("max_panel_rows", 10_000_000)
    if weighted_df.empty:
        return _empty_panel(area_df)

    df = weighted_df.copy()
    df["timestamp"] = _hour_floor(df["created_datetime"], freq)
    df = df[df["timestamp"].notna()].copy()
    if df.empty:
        return _empty_panel(area_df)

    hourly = (
        df.groupby(["h3", "timestamp"])
        .agg(
            current_violation_count=("weighted_impact", "size"),
            current_cii=("weighted_impact", "sum"),
            lanes=("lanes", "first"),
            confidence_score=("validation_weight", "mean"),
        )
        .reset_index()
    )

    cells = sorted(df["h3"].dropna().unique())
    timestamps = pd.date_range(df["timestamp"].min(), df["timestamp"].max(), freq=freq, tz="UTC")
    estimated_rows = len(cells) * len(timestamps)
    if estimated_rows > max_panel_rows:
        raise ValueError(
            "Hourly panel grid would exceed max_panel_rows: "
            f"cell count {len(cells)}, timestamp count {len(timestamps)}, "
            f"estimated rows {estimated_rows}, max_panel_rows {max_panel_rows}"
        )

    grid = pd.MultiIndex.from_product([cells, timestamps], names=["h3", "timestamp"]).to_frame(index=False)
    panel = grid.merge(hourly, on=["h3", "timestamp"], how="left")

    panel["current_violation_count"] = panel["current_violation_count"].fillna(0).astype(int)
    panel["current_cii"] = panel["current_cii"].fillna(0.0)
    panel["lanes"] = panel["lanes"].fillna(1).clip(lower=1)
    panel["confidence_score"] = panel["confidence_score"].fillna(0.0).clip(lower=0.0, upper=1.0)

    panel = _apply_hourly_cii_components(panel, cfg)

    panel = _add_metadata(panel, area_df)

    panel["hour"] = panel["timestamp"].dt.hour
    panel["dow"] = panel["timestamp"].dt.dayofweek
    panel["month"] = panel["timestamp"].dt.month
    panel["is_weekend"] = panel["dow"].isin([5, 6]).astype(int)
    panel = panel.sort_values(["h3", "timestamp"]).reset_index(drop=True)
    return panel[_panel_columns(area_df)]


def add_temporal_features(panel, cfg):
    """Add next-horizon target plus backward-looking lag and rolling features."""
    forecast_cfg = cfg.get("forecast", {})
    horizon = int(forecast_cfg.get("horizon_hours", 3))
    lag_hours = forecast_cfg.get("lag_hours", [1, 3, 6, 24])
    rolling_windows = forecast_cfg.get("rolling_windows_hours", [3, 6, 24])

    out = panel.sort_values(["h3", "timestamp"]).copy()
    if out.empty:
        out[f"target_next_{horizon}h_cii"] = pd.Series(dtype="float64")
        for lag in lag_hours:
            out[f"cii_lag_{lag}h"] = pd.Series(dtype="float64")
        for lag in [1, 3, 24]:
            out[f"violations_lag_{lag}h"] = pd.Series(dtype="float64")
        for window in rolling_windows:
            out[f"cii_roll_{window}h_mean"] = pd.Series(dtype="float64")
        return out

    grouped = out.groupby("h3", group_keys=False)

    target = pd.Series(0.0, index=out.index)
    for step in range(1, horizon + 1):
        target = target + grouped["current_cii"].shift(-step).fillna(0.0)
    out[f"target_next_{horizon}h_cii"] = target

    for lag in lag_hours:
        out[f"cii_lag_{lag}h"] = grouped["current_cii"].shift(lag).fillna(0.0)

    for lag in [1, 3, 24]:
        out[f"violations_lag_{lag}h"] = (
            grouped["current_violation_count"].shift(lag).fillna(0.0)
        )

    for window in rolling_windows:
        out[f"cii_roll_{window}h_mean"] = (
            grouped["current_cii"]
            .transform(lambda series: series.shift(1).rolling(window=window, min_periods=1).mean())
            .fillna(0.0)
        )

    for days in forecast_cfg.get("same_hour_lags_days", [1, 7]):
        lag = int(days) * 24
        out[f"cii_same_hour_{days}d"] = grouped["current_cii"].shift(lag).fillna(0.0)

    for halflife in forecast_cfg.get("ewm_halflife_hours", [3, 12, 24]):
        out[f"cii_ewm_{halflife}h"] = (
            grouped["current_cii"]
            .transform(lambda s: s.shift(1).ewm(halflife=halflife, adjust=False).mean())
            .fillna(0.0)
        )

    active = out["current_violation_count"].gt(0)
    inactive = ~active

    out["hours_since_last_violation"] = (
        active.groupby(out["h3"])
        .transform(lambda s: s.groupby(s.cumsum()).cumcount())
        .where(~active, 0)
        .astype(float)
    )

    active_groups = active.ne(active.shift()).cumsum()
    out["active_hour_streak"] = (
        active.groupby([out["h3"], active_groups])
        .cumcount()
        .where(active, 0)
        .astype(int)
    )
    out.loc[active, "active_hour_streak"] += 1

    inactive_groups = inactive.ne(inactive.shift()).cumsum()
    out["quiet_hour_streak"] = (
        inactive.groupby([out["h3"], inactive_groups])
        .cumcount()
        .where(~active, 0)
        .astype(int)
    )
    out.loc[~active, "quiet_hour_streak"] += 1

    return out


def _ring_cells(cell, radius):
    try:
        outer = set(h3.grid_disk(cell, radius))
        inner = set(h3.grid_disk(cell, radius - 1)) if radius > 1 else {cell}
        return sorted(outer - inner)
    except Exception:
        return []


def add_spatial_ring_features(panel, cfg):
    """Add same-timestamp H3 ring spillover features."""
    radii = cfg.get("forecast", {}).get("ring_radii", [1])
    out = panel.copy()
    if out.empty:
        for radius in radii:
            out[f"ring{radius}_current_cii_mean"] = pd.Series(dtype="float64")
            out[f"ring{radius}_roll_3h_cii_mean"] = pd.Series(dtype="float64")
            out[f"ring{radius}_active_neighbor_count"] = pd.Series(dtype="float64")
        return out

    current_by_time_cell = out.set_index(["timestamp", "h3"])["current_cii"].to_dict()
    roll3_by_time_cell = (
        out.set_index(["timestamp", "h3"])["cii_roll_3h_mean"].to_dict()
        if "cii_roll_3h_mean" in out.columns
        else {}
    )
    violation_by_time_cell = (
        out.set_index(["timestamp", "h3"])["current_violation_count"].to_dict()
        if "current_violation_count" in out.columns
        else {}
    )
    neighbor_cache = {}

    for radius in radii:
        current_values = []
        roll_values = []
        active_neighbor_values = []
        for row in out.itertuples(index=False):
            key = (row.h3, radius)
            if key not in neighbor_cache:
                neighbor_cache[key] = _ring_cells(row.h3, radius)
            neighbors = neighbor_cache[key]
            current = [
                current_by_time_cell[(row.timestamp, neighbor)]
                for neighbor in neighbors
                if (row.timestamp, neighbor) in current_by_time_cell
            ]
            roll3 = [
                roll3_by_time_cell[(row.timestamp, neighbor)]
                for neighbor in neighbors
                if (row.timestamp, neighbor) in roll3_by_time_cell
            ]
            active_neighbor_count = sum(
                1 for neighbor in neighbors
                if (row.timestamp, neighbor) in violation_by_time_cell
                and violation_by_time_cell[(row.timestamp, neighbor)] > 0
            )
            current_values.append(float(sum(current) / len(current)) if current else 0.0)
            roll_values.append(float(sum(roll3) / len(roll3)) if roll3 else 0.0)
            active_neighbor_values.append(float(active_neighbor_count))
        out[f"ring{radius}_current_cii_mean"] = current_values
        out[f"ring{radius}_roll_3h_cii_mean"] = roll_values
        out[f"ring{radius}_active_neighbor_count"] = active_neighbor_values
    return out
