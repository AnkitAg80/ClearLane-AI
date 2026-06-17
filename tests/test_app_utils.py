import pandas as pd
import os
from src.app_utils import load_data_safe

def test_load_data_safe(tmp_path):
    df = pd.DataFrame([{"a": 1}])
    p = tmp_path / "test.parquet"
    df.to_parquet(p)
    
    # Load existing
    loaded = load_data_safe(str(p))
    assert len(loaded) == 1
    
    # Load missing
    missing = load_data_safe("non_existent.parquet")
    assert missing is None
