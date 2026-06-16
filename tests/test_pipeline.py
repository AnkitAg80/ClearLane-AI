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
        "pcu": {"_default": 1.0},
        "severity": {"_default": 1.0},
        "cii": {
            "rush_hour_weights": {"default": 1.0},
            "recurrence_bonus": {"threshold_days": 5, "multiplier": 1.5},
            "capacity_weight_power": 0.5
        }
    }
    result = run(cfg, with_roadctx=False)

    assert result["cell_time_counts"]["count"].sum() == 5
    out = cfg["data"]["processed_dir"]
    for name in ["cell_time_counts", "cell_totals", "station_totals"]:
        path = os.path.join(out, f"{name}.parquet")
        assert os.path.exists(path)
        assert len(pd.read_parquet(path)) > 0


def test_pipeline_writes_poi_context_when_mappls_enabled(tmp_path, sample_csv, monkeypatch):
    import src.pipeline as pipeline

    class FakeClient:
        configured = True
        def get_json(self, url, params=None, use_cache=True):
            if "nearby" in url:
                return {"suggestedLocations": [{"placeName": "X", "type": params["keywords"], "distance": 50}]}
            if "snap" in url:
                return {"results": [{"lat": 12.9, "lng": 77.6, "roadName": "Test Road"}]}
            return {}

    monkeypatch.setattr(pipeline, "MapplsClient", lambda **kw: FakeClient())
    cfg = {
        "data": {"violations_csv": sample_csv,
                 "processed_dir": str(tmp_path / "processed"),
                 "cache_dir": str(tmp_path / "cache")},
        "geo": {"h3_resolution": 9,
                "bbox": {"north": 13.2, "south": 12.7, "east": 77.8, "west": 77.3}},
        "pcu": {"_default": 1.0},
        "severity": {"_default": 1.0},
        "cii": {
            "rush_hour_weights": {"default": 1.0},
            "recurrence_bonus": {"threshold_days": 5, "multiplier": 1.5},
            "capacity_weight_power": 0.5
        },
        "roadctx": {
            "network_type": "drive",
            "lanes_default_by_class": {"_default": 1}
        },
        "mappls": {"enabled": True, "cache_dir": str(tmp_path / "mcache"),
                   "nearby_url": "https://atlas.test/nearby",
                   "snap_url": "https://atlas.test/snap",
                   "poi_keywords": ["shopping mall"], "poi_radius_m": 500},
    }

    pipeline.run(cfg, with_roadctx=False, with_mappls=True)
    import os, pandas as pd
    p = os.path.join(cfg["data"]["processed_dir"], "cell_poi_context.parquet")
    assert os.path.exists(p)
    assert "poi_shopping_mall" in pd.read_parquet(p).columns


def test_pipeline_writes_cii_artifact(tmp_path, sample_csv):
    import os
    import pandas as pd
    from src.pipeline import run
    
    cfg = {
        "data": {
            "violations_csv": sample_csv,
            "processed_dir": str(tmp_path / "processed"),
            "cache_dir": str(tmp_path / "cache"),
        },
        "geo": {"h3_resolution": 9,
                "bbox": {"north": 13.2, "south": 12.7, "east": 77.8, "west": 77.3}},
        "pcu": {"CAR": 1.0, "SCOOTER": 0.3, "_default": 1.0},
        "severity": {"WRONG PARKING": 1.0, "NO PARKING": 1.0, "_default": 1.0},
        "roadctx": {
            "network_type": "drive",
            "lanes_default_by_class": {"_default": 1}
        },
        "cii": {
            "rush_hour_weights": {"default": 1.0},
            "recurrence_bonus": {"threshold_days": 5, "multiplier": 1.5},
            "capacity_weight_power": 0.5
        },
        "mappls": {"enabled": False, "cache_dir": str(tmp_path / "mcache")}
    }
    
    result = run(cfg, with_roadctx=False)
    
    out_path = os.path.join(cfg["data"]["processed_dir"], "cell_cii.parquet")
    assert os.path.exists(out_path)
    df = pd.read_parquet(out_path)
    assert "cii" in df.columns
    assert len(df) > 0
