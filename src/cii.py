def score_unit_impact(df, cfg):
    """Calculate ι(v) baseline: PCU(vehicle) × severity(type)."""
    pcu_map = cfg["pcu"]
    sev_map = cfg["severity"]
    
    df = df.copy()
    df["pcu"] = df["vehicle_type"].map(pcu_map).fillna(pcu_map["_default"])
    df["severity"] = df["violation"].map(sev_map).fillna(sev_map["_default"])
    df["unit_impact"] = df["pcu"] * df["severity"]
    return df

def apply_road_impact(df, road_df, cfg):
    """Adjust impact by road capacity: weighted = unit_impact / (lanes ^ power)."""
    power = cfg["cii"].get("capacity_weight_power", 0.5)
    
    # Merge road context; default to 1 lane if missing
    df = df.merge(road_df[["h3", "lanes"]], on="h3", how="left")
    df["lanes"] = df["lanes"].fillna(1).clip(lower=1)
    
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
        "rush_weight": "first"
    }).reset_index()
    
    cii_df = cii_df.merge(chronic_mult, on="h3", how="left")
    cii_df["cii"] = cii_df["weighted_impact"] * cii_df["rush_weight"] * cii_df["chronic_weight"]
    
    return cii_df
