from src.ingest import load_violations
from src.geo import add_h3
from src.aggregate import (
    explode_violations,
    cell_area_summary,
    cell_time_counts,
    cell_totals,
    station_totals,
)

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


def test_cell_area_summary_preserves_location_context(sample_csv):
    summary = cell_area_summary(_geo(sample_csv))
    row = summary.sort_values("record_count", ascending=False).iloc[0]
    assert row["record_count"] == 4
    assert row["violation_total"] == 4
    assert row["unique_location_count"] == 3
    assert row["top_location"] == "1st Main Road, Koramangala"
    assert row["top_police_station"] == "Madiwala"
    assert row["approved_count"] == 1
    assert row["rejected_count"] == 1


def test_cell_area_summary_quality_and_top_locations(sample_csv):
    summary = cell_area_summary(_geo(sample_csv))
    row = summary.sort_values("record_count", ascending=False).iloc[0]
    assert row["top_locations"] == "1st Main Road, Koramangala | 2nd Cross Road, Koramangala | 3rd Cross Road, Koramangala"
    assert bool(row["has_named_junction"]) is True
    assert row["no_junction_count"] == 3
    assert row["approved_rate"] == 0.25
    assert row["rejected_rate"] == 0.25
    assert 0.0 <= row["data_quality_score"] <= 1.0


def test_cell_area_summary_support_score_is_bounded_and_record_sensitive(sample_csv):
    summary = cell_area_summary(_geo(sample_csv))
    ordered = summary.sort_values("record_count", ascending=True)
    low_support = ordered.iloc[0]
    high_support = ordered.iloc[-1]

    assert "support_score" in summary.columns
    assert summary["support_score"].between(0.0, 1.0).all()
    assert high_support["record_count"] > low_support["record_count"]
    assert high_support["support_score"] > low_support["support_score"]


def test_cell_area_summary_adds_model_ready_static_encodings(sample_csv):
    summary = cell_area_summary(_geo(sample_csv))
    required = {
        "location_count_log",
        "station_count_log",
        "junction_count_log",
        "cell_total_rank_pct",
    }
    assert required.issubset(summary.columns)
    assert summary["location_count_log"].ge(0).all()
    assert summary["station_count_log"].ge(0).all()
    assert summary["junction_count_log"].ge(0).all()
    assert summary["cell_total_rank_pct"].between(0, 1).all()
