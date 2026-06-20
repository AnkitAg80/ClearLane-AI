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

def test_exact_numerical_value():
    df = pd.DataFrame([
        {"h3": "c1", "pred_cii": 100.0},
        {"h3": "c2", "pred_cii": 40.0},
    ])
    cfg = {
        "optimize": {
            "officer_budget": 3,
            "effectiveness_base": 0.5,
            "decay_factor": 0.5
        }
    }
    
    plan = allocate_officers(df, cfg)
    
    c1_relief = plan.loc[plan["h3"] == "c1", "expected_relief"].values[0]
    c2_relief = plan.loc[plan["h3"] == "c2", "expected_relief"].values[0]
    
    assert c1_relief == 75.0
    assert c2_relief == 20.0

def test_zero_budget():
    df = pd.DataFrame([{"h3": "c1", "pred_cii": 100.0}])
    cfg = {"optimize": {"officer_budget": 0, "effectiveness_base": 0.5, "decay_factor": 0.5}}
    plan = allocate_officers(df, cfg)
    assert plan["officers_assigned"].sum() == 0
    assert plan["expected_relief"].sum() == 0.0

def test_all_zero_cii():
    df = pd.DataFrame([{"h3": "c1", "pred_cii": 0.0}, {"h3": "c2", "pred_cii": 0.0}])
    cfg = {"optimize": {"officer_budget": 5, "effectiveness_base": 0.5, "decay_factor": 0.5}}
    plan = allocate_officers(df, cfg)
    assert plan["officers_assigned"].sum() == 0
    assert plan["expected_relief"].sum() == 0.0

def test_budget_exceeds_useful_allocations():
    df = pd.DataFrame([{"h3": "c1", "pred_cii": -10.0}, {"h3": "c2", "pred_cii": 0.0}])
    cfg = {"optimize": {"officer_budget": 5, "effectiveness_base": 0.5, "decay_factor": 0.5}}
    plan = allocate_officers(df, cfg)
    assert plan["officers_assigned"].sum() == 0


def test_allocation_accepts_custom_score_column():
    df = pd.DataFrame([
        {"h3": "c1", "pred_next_3h_cii": 100.0},
        {"h3": "c2", "pred_next_3h_cii": 20.0},
    ])
    cfg = {"optimize": {"officer_budget": 2, "effectiveness_base": 0.5, "decay_factor": 0.5}}
    plan = allocate_officers(df, cfg, score_col="pred_next_3h_cii")
    assert plan["officers_assigned"].sum() == 2
    assert plan.loc[plan["h3"] == "c1", "expected_relief"].iloc[0] > 0
