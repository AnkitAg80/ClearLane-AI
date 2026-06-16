import pandas as pd

def allocate_officers(forecast_df, cfg):
    """Greedy submodular allocation of officers to maximize congestion relief."""
    budget = cfg["optimize"]["officer_budget"]
    eff = cfg["optimize"]["effectiveness_base"]
    decay = cfg["optimize"]["decay_factor"]
    
    # Initialize state
    df = forecast_df.copy()
    df["officers_assigned"] = 0
    df["expected_relief"] = 0.0
    
    # Keep track of marginal gain for next officer per cell
    df["marginal_gain"] = df["pred_cii"] * eff
    
    for _ in range(budget):
        if df["marginal_gain"].max() <= 0:
            break # No more relief possible
            
        # Pick best cell
        best_idx = df["marginal_gain"].idxmax()
        
        # Assign officer
        df.at[best_idx, "officers_assigned"] += 1
        df.at[best_idx, "expected_relief"] += df.at[best_idx, "marginal_gain"]
        
        # Update marginal gain for this cell: CII * eff * decay^k
        k = df.at[best_idx, "officers_assigned"]
        df.at[best_idx, "marginal_gain"] = df.at[best_idx, "pred_cii"] * eff * (decay ** k)
        
    return df
