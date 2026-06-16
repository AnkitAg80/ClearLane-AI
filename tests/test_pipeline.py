import os
import pandas as pd
from src.pipeline import run


def test_pipeline_writes_artifacts(tmp_path, sample_csv):
    cfg = {
        "data": {
            "violations_csv": sample_csv,
            "processed_dir": str(tmp_path / "processed"),
            "cache_dir": str(tmp_path / "cache"),
        },
        "geo": {"h3_resolution": 9,
                "bbox": {"north": 13.2, "south": 12.7, "east": 77.8, "west": 77.3}},
    }
    result = run(cfg, with_roadctx=False)

    assert result["cell_time_counts"]["count"].sum() == 5
    out = cfg["data"]["processed_dir"]
    for name in ["cell_time_counts", "cell_totals", "station_totals"]:
        path = os.path.join(out, f"{name}.parquet")
        assert os.path.exists(path)
        assert len(pd.read_parquet(path)) > 0
