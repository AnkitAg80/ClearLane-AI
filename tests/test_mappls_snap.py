import src.mappls.snap as snap


class FakeResp:
    def __init__(self, payload):
        self._p = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self._p


class FakeClient:
    def _get_token(self):
        return "tok"


def test_snap_to_road_parses_points_and_uses_access_token(monkeypatch):
    captured = {}

    def fake_get(url, params=None, timeout=None):
        captured["params"] = params
        return FakeResp({"results": [{"lat": 12.9, "lng": 77.6, "roadName": "80 Ft Road"}]})

    monkeypatch.setattr(snap.requests, "get", fake_get)
    out = snap.snap_to_road(FakeClient(), "https://route.test/snap", [(12.9, 77.6)])
    assert out[0]["road_name"] == "80 Ft Road"
    # live-verified contract: access_token query-param + pts="lat,lng;..."
    assert captured["params"]["access_token"] == "tok"
    assert captured["params"]["pts"] == "12.9,77.6"


def test_snap_to_road_batches_over_100(monkeypatch):
    calls = {"n": 0}

    def fake_get(url, params=None, timeout=None):
        calls["n"] += 1
        return FakeResp({"results": []})

    monkeypatch.setattr(snap.requests, "get", fake_get)
    pts = [(12.9 + i * 1e-4, 77.6) for i in range(150)]
    snap.snap_to_road(FakeClient(), "https://route.test/snap", pts)
    assert calls["n"] == 2  # 150 points -> two batches (<=100 each)
