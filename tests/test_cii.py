import pandas as pd
import pytest
from src.cii import score_unit_impact

def test_score_unit_impact_calculates_pcu_x_severity():
    df = pd.DataFrame([
        {"id": "V1", "vehicle_type": "CAR", "violation": "WRONG PARKING"},
        {"id": "V2", "vehicle_type": "SCOOTER", "violation": "DOUBLE PARKING"},
    ])
    cfg = {
        "pcu": {"CAR": 1.0, "SCOOTER": 0.3, "_default": 1.0},
        "severity": {"WRONG PARKING": 1.0, "DOUBLE PARKING": 1.7, "_default": 1.0}
    }
    scored = score_unit_impact(df, cfg)
    # V1: 1.0 * 1.0 = 1.0
    # V2: 0.3 * 1.7 = 0.51
    assert scored.loc[0, "unit_impact"] == 1.0
    assert round(scored.loc[1, "unit_impact"], 2) == 0.51
