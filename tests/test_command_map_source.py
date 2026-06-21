from pathlib import Path


COMMAND_MAP = Path("frontend/src/components/CommandMap.jsx")


def test_command_map_uses_street_readable_basemap():
    source = COMMAND_MAP.read_text(encoding="utf-8")

    assert "TileLayer" in source
    assert "rastertiles/voyager" in source
    assert "dark-matter-gl-style" not in source
    assert "react-map-gl" not in source


def test_command_map_attempts_mappls_before_fallback_basemap():
    source = COMMAND_MAP.read_text(encoding="utf-8")

    assert "mapplsConfig.sdk_url" in source
    assert "Map powered by Mappls" in source
    assert "Fallback street map" in source
    assert "globalThis.mappls?.Map" in source
    assert "sdk_urls" in source
    assert "clearColor: [0, 0, 0, 0]" in source
    assert "background: 'transparent'" in source


def test_command_map_renders_hotspots_as_flat_translucent_overlay():
    source = COMMAND_MAP.read_text(encoding="utf-8")

    assert "extruded: false" in source
    assert "elevationScale" not in source
    assert "getElevation" not in source


def test_command_map_offers_after_deployment_metric():
    source = COMMAND_MAP.read_text(encoding="utf-8")

    assert "remaining_next_3h_cii" in source
    assert "Remaining Next 3h CII" in source
