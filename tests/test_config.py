from src import config


def test_load_returns_expected_defaults():
    cfg = config.load()
    assert cfg["geo"]["h3_resolution"] == 9
    assert cfg["geo"]["bbox"]["north"] == 13.2
    assert cfg["pcu"]["CAR"] == 1.0
    assert cfg["severity"]["_default"] == 1.0


def test_config_has_mappls_section():
    cfg = config.load()
    assert cfg["mappls"]["enabled"] in (True, False)
    assert cfg["mappls"]["token_url"].startswith("https://")
    assert "metro station" in cfg["mappls"]["poi_keywords"]


def test_config_has_cii_section():
    from src import config
    cfg = config.load()
    assert "cii" in cfg
    assert cfg["cii"]["rush_hour_weights"]["morning_peak"]["weight"] == 2.0
    assert cfg["cii"]["recurrence_bonus"]["multiplier"] == 1.5
