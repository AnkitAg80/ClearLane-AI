import h3
from src.ingest import load_violations
from src.geo import add_h3

BBOX = {"north": 13.2, "south": 12.7, "east": 77.8, "west": 77.3}


def test_out_of_bbox_dropped(sample_csv):
    df = add_h3(load_violations(sample_csv), resolution=9, bbox=BBOX)
    # V5 (99,99) removed; from the 6 ingested rows -> 5 remain
    assert len(df) == 5
    assert "V5" not in set(df["id"])


def test_h3_and_time_features(sample_csv):
    df = add_h3(load_violations(sample_csv), resolution=9, bbox=BBOX).set_index("id")
    expected = h3.latlng_to_cell(12.9255567, 77.618665, 9)
    assert df.loc["V1", "h3"] == expected
    assert df.loc["V1", "hour"] == 9
    assert df.loc["V1", "dow"] == 1  # 2024-01-02 is a Tuesday (Mon=0)
