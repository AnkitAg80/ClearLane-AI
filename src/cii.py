def score_unit_impact(df, cfg):
    """Calculate ι(v) baseline: PCU(vehicle) × severity(type)."""
    pcu_map = cfg["pcu"]
    sev_map = cfg["severity"]
    
    df = df.copy()
    df["pcu"] = df["vehicle_type"].map(pcu_map).fillna(pcu_map["_default"])
    df["severity"] = df["violation"].map(sev_map).fillna(sev_map["_default"])
    df["unit_impact"] = df["pcu"] * df["severity"]
    return df
