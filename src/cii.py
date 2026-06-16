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
