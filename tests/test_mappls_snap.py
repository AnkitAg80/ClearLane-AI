from src.mappls.snap import snap_to_road


class FakeClient:
    def __init__(self, payload):
        self._p = payload
        self.last_params = None
    def get_json(self, url, params=None, use_cache=True):
        self.last_params = params
        return self._p


def test_snap_to_road_parses_points():
    payload = {"results": [{"lat": 12.9, "lng": 77.6, "roadName": "80 Ft Road"}]}
    client = FakeClient(payload)
    out = snap_to_road(client, "https://route.test/snap", [(12.9, 77.6)])
    assert out[0]["road_name"] == "80 Ft Road"


def test_snap_to_road_batches_over_100(monkeypatch):
    calls = {"n": 0}

    class CountingClient:
        def get_json(self, url, params=None, use_cache=True):
            calls["n"] += 1
            return {"results": []}

    pts = [(12.9 + i * 1e-4, 77.6) for i in range(150)]
    snap_to_road(CountingClient(), "https://route.test/snap", pts)
    assert calls["n"] == 2  # 150 points -> two batches (<=100 each)
