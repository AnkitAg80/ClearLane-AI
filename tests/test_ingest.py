import pandas as pd
from src.ingest import load_violations


def test_load_drops_null_datetime_and_dedupes(sample_csv):
    df = load_violations(sample_csv)
    # V6 dropped (NULL datetime), duplicate V4 collapsed -> 6 rows: V1,V2,V3,V4,V5,V7
    assert len(df) == 6
    assert (df["id"] == "V4").sum() == 1
    assert "V6" not in set(df["id"])


def test_violation_arrays_parsed(sample_csv):
    df = load_violations(sample_csv).set_index("id")
    assert df.loc["V1", "violation_list"] == ["WRONG PARKING", "NO PARKING"]
    assert df.loc["V7", "violation_list"] == []  # malformed -> empty


def test_types_coerced_and_normalized(sample_csv):
    df = load_violations(sample_csv).set_index("id")
    assert df.loc["V2", "vehicle_type"] == "SCOOTER"  # uppercased
    assert pd.api.types.is_datetime64_any_dtype(df["created_datetime"])
    assert df.loc["V1", "latitude"] == 12.9255567
