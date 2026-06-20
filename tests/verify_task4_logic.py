
import pandas as pd
import numpy as np

# Mocking the data loading part
plan_df = pd.DataFrame({
    "h3": ["c1", "c2", "c3"],
    "officers_assigned": [1, 2, 0],
    "expected_relief": [10.5, 20.1, 0.0],
    "pred_cii": [15.0, 25.0, 5.0]
})

top_n = 50

# Implementation logic from Tab 2 (Updated)
full_active_plan = plan_df[plan_df["officers_assigned"] > 0].sort_values("expected_relief", ascending=False)
display_plan = full_active_plan.head(top_n)

# Check columns
expected_cols = ["h3", "officers_assigned", "expected_relief", "pred_cii"]
assert all(col in display_plan.columns for col in expected_cols)
assert len(display_plan) == 2
assert display_plan.iloc[0]["h3"] == "c2" # Highest relief first

# Mocking CSV export (Full Plan)
csv = full_active_plan.to_csv(index=False).encode('utf-8')
assert len(full_active_plan) == 2 # Ensure full plan is used, not just display_plan
print("PASSED UPDATED LOGIC VERIFICATION")
