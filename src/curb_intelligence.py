import math


def _num(row, key, default=0.0):
    value = row.get(key, default) if hasattr(row, "get") else default
    try:
        if value is None or math.isnan(float(value)):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def compute_capacity_theft(row):
    lanes = max(_num(row, "lanes", 1.0), 1.0)
    ratio = max(0.0, min(_num(row, "capacity_ratio", _num(row, "current_capacity_ratio", 0.0)), 1.0))
    theft_pct = round(ratio * 100.0, 2)
    effective_lanes = round(max(lanes * (1.0 - ratio), 0.0), 2)
    return {
        "capacity_theft_pct": theft_pct,
        "effective_lanes_remaining": effective_lanes,
        "capacity_theft_label": f"{lanes:.1f} lanes behaving like {effective_lanes:.1f} lanes",
    }


def classify_lifecycle(row):
    current = _num(row, "current_cii")
    forecast = _num(row, "pred_next_3h_cii", _num(row, "forecast_cii"))
    lag = _num(row, "cii_lag_1h")
    neighbors = _num(row, "ring1_active_neighbor_count")
    active_streak = _num(row, "active_hour_streak")
    chronic_component = _num(row, "current_chronic_component", _num(row, "chronic_component", 1.0))

    if chronic_component > 1.0 and active_streak >= 3:
        return "chronic"
    if neighbors >= 3 and forecast >= current:
        return "spreading"
    if current <= 3 and forecast >= 8:
        return "emerging"
    if current >= 6 and forecast >= current * 0.85:
        return "active"
    if current > 0 and forecast < max(lag, current) * 0.65:
        return "cooling"
    return "resolved" if current <= 0 and forecast <= 0 else "active"


def compute_time_to_criticality(row, critical_threshold=10.0):
    one_hour = _num(row, "pred_next_1h_cii", _num(row, "pred_next_1h_cii_proxy"))
    two_hour = _num(row, "pred_next_2h_cii", _num(row, "pred_next_2h_cii_proxy"))
    checks = [
        (0, _num(row, "current_cii")),
        (60, one_hour),
        (120, two_hour),
        (180, _num(row, "pred_next_3h_cii", _num(row, "forecast_cii"))),
    ]
    for minutes, value in checks:
        if value >= critical_threshold:
            label = "critical now" if minutes == 0 else f"critical in {minutes} min"
            return {"time_to_criticality_minutes": minutes, "criticality_label": label}
    return {"time_to_criticality_minutes": None, "criticality_label": "stable below threshold"}


def compute_marginal_officer_values(predicted_cii, effectiveness, decay, max_officers=4):
    base = max(float(predicted_cii or 0.0), 0.0)
    return [round(base * effectiveness * (decay ** idx), 2) for idx in range(max_officers)]


def fingerprint_hotspot(row):
    location = str(row.get("top_location", "") or "").lower()
    junction = str(row.get("top_junction", "") or "").lower()
    text = f"{location} {junction}"
    hour = int(_num(row, "hour", 0))
    chronic = _num(row, "current_chronic_component", _num(row, "chronic_component", 1.0))
    if "metro" in text:
        return "metro surge"
    if any(word in text for word in ["market", "bazaar", "mall", "commercial"]):
        return "market loading"
    if any(word in text for word in ["school", "college", "campus"]):
        return "school pickup"
    if 17 <= hour <= 21:
        return "evening curb pressure"
    if chronic > 1.0:
        return "repeat corridor"
    return "general curb pressure"


def compute_opportunity_gap(row):
    score = _num(row, "deployment_score", _num(row, "pred_next_3h_cii"))
    assigned = _num(row, "officers_assigned")
    support = max(0.0, min(_num(row, "support_score", 1.0), 1.0))
    coverage_penalty = 1.0 / (1.0 + assigned)
    return round(score * coverage_penalty * support, 3)


def build_mission_card(row, effectiveness, decay):
    label = str(row.get("label") or row.get("top_location") or row.get("h3") or "hotspot")
    officers = int(_num(row, "officers_assigned"))
    predicted = _num(row, "pred_next_3h_cii", _num(row, "forecast_cii"))
    capacity = compute_capacity_theft(row)
    lifecycle = classify_lifecycle(row)
    criticality = compute_time_to_criticality(row)
    mission_type = fingerprint_hotspot(row)
    return {
        "id": str(row.get("h3") or label),
        "title": f"Clear {label}",
        "station": row.get("top_police_station") or "Unassigned station",
        "location": label,
        "mission_type": mission_type,
        "lifecycle": lifecycle,
        "violation_count": int(_num(row, "current_violation_count")),
        "officers_required": officers,
        "deployment_score": round(_num(row, "deployment_score"), 4),
        "predicted_cii": round(predicted, 2),
        "expected_relief": round(_num(row, "expected_relief"), 2),
        "capacity_theft": capacity,
        "criticality": criticality,
        "opportunity_gap": compute_opportunity_gap(row),
        "marginal_officer_values": compute_marginal_officer_values(predicted, effectiveness, decay, 4),
    }
