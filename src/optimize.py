import pandas as pd
import heapq
import itertools

def allocate_officers(forecast_df, cfg, score_col="pred_cii"):
    """Greedy submodular allocation of officers to maximize congestion relief."""
    budget = cfg["optimize"]["officer_budget"]
    eff = cfg["optimize"]["effectiveness_base"]
    decay = cfg["optimize"]["decay_factor"]
    
    heap = []
    tie_breaker = itertools.count()
    for idx, row in forecast_df.iterrows():
        mg = row[score_col] * eff
        if mg > 0:
            heapq.heappush(heap, (-mg, next(tie_breaker), idx, row[score_col], 0))
            
    officers_assigned = {idx: 0 for idx in forecast_df.index}
    expected_relief = {idx: 0.0 for idx in forecast_df.index}
    
    for _ in range(budget):
        if not heap:
            break
            
        neg_mg, _, idx, pred_cii, k = heapq.heappop(heap)
        mg = -neg_mg
        
        officers_assigned[idx] += 1
        expected_relief[idx] += mg
        
        k += 1
        next_mg = pred_cii * eff * (decay ** k)
        if next_mg > 0:
            heapq.heappush(heap, (-next_mg, next(tie_breaker), idx, pred_cii, k))
            
    df = forecast_df.copy()
    df["officers_assigned"] = df.index.map(officers_assigned)
    df["expected_relief"] = df.index.map(expected_relief)
    
    return df
