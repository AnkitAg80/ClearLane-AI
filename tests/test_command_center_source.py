from pathlib import Path


APP = Path("frontend/src/App.jsx")
TOOLBAR = Path("frontend/src/components/Toolbar.jsx")


def test_command_center_uses_deployed_places_language():
    source = APP.read_text(encoding="utf-8")

    assert "Deployed Places" in source
    assert "Critical Zones" not in source
    assert "places receiving at least one assigned officer" in source


def test_command_center_labels_relief_as_cii_units():
    source = APP.read_text(encoding="utf-8")

    assert "Expected CII Relief" in source
    assert "CII reduction units" in source


def test_toolbar_has_explicit_search_button():
    source = TOOLBAR.read_text(encoding="utf-8")

    assert ">Search</button>" in source or ">Search<" in source
    assert "aria-label=\"Submit search\"" in source


def test_toolbar_exposes_after_deployment_map_mode():
    source = TOOLBAR.read_text(encoding="utf-8")

    assert "remaining_next_3h_cii" in source
    assert "After deployment" in source
