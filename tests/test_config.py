from src import config


def test_load_returns_expected_defaults():
    cfg = config.load()
    assert cfg["geo"]["h3_resolution"] == 9
    assert cfg["geo"]["bbox"]["north"] == 13.2
    assert cfg["pcu"]["CAR"] == 1.0
    assert cfg["severity"]["_default"] == 1.0
