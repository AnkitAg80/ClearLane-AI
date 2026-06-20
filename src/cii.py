def score_unit_impact(df, cfg):
    """Calculate i(v) baseline: PCU(vehicle) x severity(type)."""
    pcu_map = cfg["pcu"]
    sev_map = cfg["severity"]
    validation_weights = cfg.get("validation_weights", {"_unknown": 1.0})
    
    df = df.copy()
    df["pcu"] = df["vehicle_type"].map(pcu_map).fillna(pcu_map["_default"])
    df["severity"] = df["violation"].map(sev_map).fillna(sev_map["_default"])
    if "validation_status" in df.columns:
        status = df["validation_status"].fillna("_unknown").astype(str).str.lower()
        df["validation_weight"] = status.map(validation_weights).fillna(validation_weights.get("_unknown", 1.0))
    else:
        df["validation_weight"] = validation_weights.get("_unknown", 1.0)
    df["unit_impact"] = df["pcu"] * df["severity"] * df["validation_weight"]
    return df

def apply_road_impact(df, road_df, cfg):
    """Attach road capacity and calculate the pre-temporal impact signal."""
    cii_cfg = cfg["cii"]
    power = cii_cfg.get("capacity_weight_power", 0.5)
    capacity_model = cii_cfg.get("capacity_model", "legacy_power")
    
    # Merge road context; default to 1 lane if missing
    df = df.merge(road_df[["h3", "lanes"]], on="h3", how="left")
    df["lanes"] = df["lanes"].fillna(1).clip(lower=1)
    
    if capacity_model == "bpr":
        df["weighted_impact"] = df["unit_impact"]
    else:
        df["weighted_impact"] = df["unit_impact"] / (df["lanes"] ** power)
    return df

def calculate_cii(df, cfg):
    """Aggregate to (h3, hour, dow) and apply temporal/chronic multipliers."""
    cii_cfg = cfg["cii"]
    
    # 1. Temporal Weighting
    def get_rush_weight(hour):
        weights = cii_cfg["rush_hour_weights"]
        for peak_name, peak_cfg in weights.items():
            if peak_name == "default": continue
            if peak_cfg["start"] <= hour < peak_cfg["end"]:
                return peak_cfg["weight"]
        return weights.get("default", 1.0)

    df = df.copy()
    if "lanes" not in df.columns:
        df["lanes"] = 1
    if "validation_weight" not in df.columns:
        df["validation_weight"] = 1.0
    df["lanes"] = df["lanes"].fillna(1).clip(lower=1)
    df["rush_weight"] = df["hour"].apply(get_rush_weight)
    
    # 2. Chronic Weighting (Recurrence)
    # Calculate number of unique days per cell
    cell_days = df.groupby("h3")["created_datetime"].apply(lambda x: x.dt.date.nunique())
    bonus_cfg = cii_cfg["recurrence_bonus"]
    chronic_mult = cell_days.apply(
        lambda d: bonus_cfg["multiplier"] if d >= bonus_cfg["threshold_days"] else 1.0
    ).reset_index(name="chronic_weight")
    
    # 3. Aggregation
    cii_df = df.groupby(["h3", "hour", "dow"]).agg({
        "weighted_impact": "sum",
        "validation_weight": "mean",
        "lanes": "first",
        "rush_weight": "first"
    }).reset_index()
    
    cii_df = cii_df.merge(chronic_mult, on="h3", how="left")
    if cii_cfg.get("capacity_model", "legacy_power") == "bpr":
        alpha = cii_cfg.get("bpr_alpha", 0.15)
        beta = cii_cfg.get("bpr_beta", 4)
        lane_capacity = cii_cfg.get("lane_capacity_proxy", 10)
        ratio_cap = cii_cfg.get("bpr_ratio_cap")
        capacity = (cii_df["lanes"] * lane_capacity).clip(lower=1)
        cii_df["capacity_ratio"] = cii_df["weighted_impact"] / capacity
        if ratio_cap is not None:
            cii_df["capacity_ratio"] = cii_df["capacity_ratio"].clip(upper=ratio_cap)
        cii_df["capacity_delay_factor"] = 1 + alpha * (cii_df["capacity_ratio"] ** beta)
    else:
        cii_df["capacity_ratio"] = 0.0
        cii_df["capacity_delay_factor"] = 1.0
    cii_df["base_impact"] = cii_df["weighted_impact"]
    cii_df["capacity_component"] = cii_df["capacity_delay_factor"]
    cii_df["temporal_component"] = cii_df["rush_weight"]
    cii_df["chronic_component"] = cii_df["chronic_weight"]
    cii_df["confidence_score"] = cii_df["validation_weight"].clip(lower=0, upper=1)
    cii_df["cii"] = (
        cii_df["base_impact"]
        * cii_df["capacity_component"]
        * cii_df["temporal_component"]
        * cii_df["chronic_component"]
    )
    
    return cii_df
