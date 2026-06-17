import pandas as pd
import os

def load_data_safe(path):
    """Load parquet file safely, return None if missing."""
    if os.path.exists(path):
        return pd.read_parquet(path)
    return None
