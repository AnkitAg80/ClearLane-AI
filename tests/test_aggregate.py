from src.ingest import load_violations
from src.geo import add_h3
from src.aggregate import explode_violations, cell_time_counts, cell_totals, station_totals

BBOX = {"north": 13.2, "south": 12.7, "east": 77.8, "west": 77.3}


def _geo(sample_csv):
    return add_h3(load_violations(sample_csv), resolution=9, bbox=BBOX)


def test_explode_drops_empty_lists(sample_csv):
    e = explode_violations(_geo(sample_csv))
    # V1=2, V2=1, V3=1, V4=1, V7=0 -> 5 exploded violation rows
    assert len(e) == 5


def test_cell_time_counts_sum(sample_csv):
    ctc = cell_time_counts(_geo(sample_csv))
    assert ctc["count"].sum() == 5


def test_station_totals(sample_csv):
    st = station_totals(_geo(sample_csv)).set_index("police_station")
    assert st.loc["Madiwala", "violations"] == 4  # V1(2)+V2(1)+V4(1)
    assert st.loc["Bellandur", "violations"] == 1  # V3


def test_cell_totals_sum(sample_csv):
    tot = cell_totals(_geo(sample_csv))
    assert tot["total"].sum() == 5
