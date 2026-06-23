from pathlib import Path


HOTSPOT_DETAIL = Path("frontend/src/components/hotspots/HotspotDetailSheet.tsx")


def test_hotspot_detail_does_not_show_simulated_time_series():
    source = HOTSPOT_DETAIL.read_text(encoding="utf-8")

    assert "Congestion Trend (Simulated)" not in source
    assert "Simulation since real rank" not in source
    assert "Forecast worsened" not in source
    assert "Threshold crossed" not in source


def test_hotspot_detail_removes_unwired_operator_buttons_and_wires_canvas_cta():
    source = HOTSPOT_DETAIL.read_text(encoding="utf-8")

    assert "Deploy {assigned} Officers" not in source
    assert "Open in Command Map" not in source
    assert "Operator Guidance" not in source
    assert "View on Canvas" in source
    assert "navigate(`/canvas?h3=" in source
