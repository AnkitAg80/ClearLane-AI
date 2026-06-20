import pandas as pd
import os
import pydeck as pdk
from src import config
from src.app_utils import load_data_safe, get_h3_layer

def test_integration():
    print("Testing integration...")
    cfg = config.load()
    processed_dir = cfg["data"]["processed_dir"]
    
    cii_df = load_data_safe(os.path.join(processed_dir, "cell_cii.parquet"))
    plan_df = load_data_safe(os.path.join(processed_dir, "deployment_plan.parquet"))
    
    assert cii_df is not None, "cii_df is None"
    assert plan_df is not None, "plan_df is None"
    
    print(f"CII data columns: {cii_df.columns.tolist()}")
    
    # Test get_h3_layer
    color_mode = "CII (Impact)"
    color_col = "cii" if color_mode == "CII (Impact)" else "weighted_impact"
    
    layer = get_h3_layer(cii_df, color_col)
    assert isinstance(layer, pdk.Layer), "layer is not a pdk.Layer"
    assert layer.type == "H3HexagonLayer", f"Unexpected layer type: {layer.type}"
    
    print("Integration test passed!")

if __name__ == "__main__":
    try:
        test_integration()
    except Exception as e:
        print(f"Integration test failed: {e}")
        exit(1)
