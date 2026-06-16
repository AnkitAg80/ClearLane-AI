import pandas as pd
from src.optimize import allocate_officers

def test_greedy_allocation():
    df = pd.DataFrame([
        {"h3": "c1", "pred_cii": 100.0},
        {"h3": "c2", "pred_cii": 50.0},
    ])
    cfg = {
        "optimize": {
            "officer_budget": 3,
            "effectiveness_base": 0.5,
            "decay_factor": 0.5
        }
    }
    
    plan = allocate_officers(df, cfg)
    assert plan["officers_assigned"].sum() == 3
    assert plan.loc[plan["h3"] == "c1", "officers_assigned"].values[0] >= 1
    assert "expected_relief" in plan.columns
